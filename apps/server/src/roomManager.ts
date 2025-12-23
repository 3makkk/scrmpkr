import logger from "./logger.js";
import Room from "./room.js";
import { FIB_DECK, type User } from "./types.js";
import type {
  RoomState,
  RoundState,
  RoundStatus,
  RoundVote,
} from "@scrmpkr/shared";
import type { UserRole } from "@scrmpkr/shared";
import type { PokerNamespace } from "./roomManagerTypes.js";

export type RevealedVote = RoundVote;
export type { RoomState, RoundState, RoundStatus, User };

export class RoomManager {
  constructor() {
    this.rooms = new Map<string, Room>();
    logger.info("RoomManager was initialized");
  }

  private rooms: Map<string, Room>;

  private normalizeRoomId(roomId: string): string {
    return roomId.trim().toLowerCase();
  }

  private validateRoomId(roomId: string): string {
    const normalized = this.normalizeRoomId(roomId);
    if (!normalized) {
      throw new Error("Room name is required");
    }
    if (normalized.length > 50) {
      throw new Error("Room name must be at most 50 characters");
    }
    if (!/^[a-z_-]+$/.test(normalized)) {
      throw new Error(
        "Room name can only contain lowercase letters, hyphens, and underscores"
      );
    }
    return normalized;
  }

  createRoom(roomId: string, user: User, role: UserRole): Room {
    const id = this.validateRoomId(roomId);
    const roomLogger = logger.child({ roomId: id, userId: user.id });

    if (this.rooms.has(id)) {
      roomLogger.warn("Room creation was rejected");
      throw new Error("Room already exists");
    }

    const room = new Room(id, {
      id: user.id,
      name: user.name,
      hasVoted: false,
      role,
    });
    this.rooms.set(id, room);

    roomLogger.info("Room was created");

    return room;
  }

  roomExists(id: string): boolean {
    const roomId = this.normalizeRoomId(id);
    return this.rooms.has(roomId);
  }

  joinRoom(id: string, user: User, role: UserRole = "participant"): Room {
    const roomId = this.validateRoomId(id);
    const roomLogger = logger.child({
      roomId,
      userId: user.id,
      userName: user.name,
    });

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const wasAlreadyInRoom = room.participants.has(user.id);
    room.addParticipant(user, role);

    roomLogger.info({ role, rejoined: wasAlreadyInRoom }, "User joined room");
    roomLogger.info(
      { participants: room.participants.size },
      "Room participant count was updated"
    );

    return room;
  }

  castVote(id: string, userId: string, value: number | "?"): void {
    const roomId = this.normalizeRoomId(id);
    const roomLogger = logger.child({ roomId, userId });
    const room = this.rooms.get(roomId);
    if (!room) {
      roomLogger.warn({ value }, "Vote was rejected, room not found");
      return;
    }

    // Check if user can vote (only owners and participants, not visitors)
    if (!room.canVote(userId)) {
      roomLogger.warn({ value }, "Vote was rejected, insufficient permissions");
      return;
    }

    if (!FIB_DECK.includes(value)) {
      roomLogger.warn({ value }, "Vote was rejected, invalid value");
      return;
    }

    const participant = room.recordVote(userId, value);
    if (participant) {
      roomLogger.info({ userName: participant.name }, "User cast vote");
    } else {
      roomLogger.warn("Vote was rejected, user not found");
    }
  }

  clearVotes(id: string, userId: string): void {
    const roomId = this.normalizeRoomId(id);
    const roomLogger = logger.child({ roomId, userId });
    const room = this.rooms.get(roomId);
    if (!room) {
      roomLogger.warn("Clear votes was rejected, room not found");
      return;
    }

    // Check if user can clear votes (only owners)
    if (!room.canClearVotes(userId)) {
      roomLogger.warn("Clear votes was rejected, insufficient permissions");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (participant) => participant.hasVoted
    ).length;

    room.resetForNewRound();

    roomLogger.info({ removedVotes: votedCount }, "Votes were cleared");
  }

  hasAnyVotes(id: string): boolean {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const hasVotes = room.hasAnyVotes();
    logger.child({ roomId }).info({ hasVotes }, "Room votes were checked");
    return hasVotes;
  }

  getState(id: string): RoomState | null {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.toState();
  }

  startReveal(id: string, userId: string, namespace: PokerNamespace): void {
    const roomId = this.normalizeRoomId(id);
    const roomLogger = logger.child({ roomId, userId });
    const room = this.rooms.get(roomId);
    if (!room) {
      roomLogger.warn("Reveal was rejected, room not found");
      return;
    }

    // Check if user can reveal votes (only owners)
    if (!room.canRevealVotes(userId)) {
      roomLogger.warn("Reveal was rejected, insufficient permissions");
      return;
    }

    if (!this.hasAnyVotes(roomId)) {
      roomLogger.warn("Reveal was blocked, no votes");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (participant) => participant.hasVoted
    ).length;
    roomLogger.info(
      {
        votedCount,
        totalParticipants: room.participants.size,
      },
      "Reveal was started"
    );

    const unanimousValue = room.revealCurrentRound();

    roomLogger.info(
      {
        votesRevealed: room.getCurrentRoundState().votes.length,
        unanimousValue: unanimousValue ?? "none",
      },
      "Reveal was completed"
    );

    const updatedState = this.getState(roomId);
    if (updatedState) namespace.to(roomId).emit("room:state", updatedState);
  }

  leaveRoom(
    roomId: string,
    userId: string
  ): false | { roomDeleted: boolean; wasInRoom: boolean } {
    const normalizedId = this.normalizeRoomId(roomId);
    const roomLogger = logger.child({ roomId: normalizedId, userId });
    const room = this.rooms.get(normalizedId);
    if (!room) {
      roomLogger.warn("Leave room was rejected, room not found");
      return false;
    }

    const participant = room.participants.get(userId);
    const wasInRoom = room.removeParticipant(userId);

    if (wasInRoom) {
      roomLogger.info(
        { userName: participant?.name || "unknown" },
        "User left room"
      );
    }

    if (room.participants.size === 0) {
      this.rooms.delete(normalizedId);
      roomLogger.info("Room was deleted");
      return { roomDeleted: true, wasInRoom };
    }

    roomLogger.info(
      { participants: room.participants.size },
      "Room participant count was updated"
    );
    return { roomDeleted: false, wasInRoom };
  }

  findUserRoom(userId: string): string | null {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        return roomId;
      }
    }
    return null;
  }

  updateParticipantName(
    roomId: string,
    userId: string,
    newName: string
  ): boolean {
    const normalizedId = this.normalizeRoomId(roomId);
    const roomLogger = logger.child({ roomId: normalizedId, userId });
    const room = this.rooms.get(normalizedId);
    if (!room) {
      roomLogger.warn("Update participant name was rejected, room not found");
      return false;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      roomLogger.warn(
        "Update participant name was rejected, participant not found"
      );
      return false;
    }

    room.updateParticipantName(userId, newName);

    roomLogger.info("Participant name was updated");

    return true;
  }

  getTotalActiveUsers(): number {
    const uniqueUsers = new Set<string>();
    for (const room of this.rooms.values()) {
      for (const participantId of room.participants.keys()) {
        uniqueUsers.add(participantId);
      }
    }
    return uniqueUsers.size;
  }

  getRoomsCount(): number {
    return this.rooms.size;
  }
}

export default RoomManager;
