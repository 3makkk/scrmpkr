import logger from "./logger";
import Room from "./room";
import { FIB_DECK, type User } from "./types";
import type {
  RoomState,
  RoundState,
  RoundStatus,
  RoundVote,
} from "@scrmpkr/shared";
import type { PokerNamespace } from "./roomManagerTypes";

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
        "Room name can only contain lowercase letters, hyphens, and underscores",
      );
    }
    return normalized;
  }

  createRoom(ownerId: string, ownerName: string, roomId: string): Room {
    const id = this.validateRoomId(roomId);

    if (this.rooms.has(id)) {
      logger.warn({ roomId: id, ownerId }, "Room creation was rejected");
      throw new Error("Room already exists");
    }

    const room = new Room(id, ownerId, ownerName);
    this.rooms.set(id, room);

    logger.info({ roomId: id, ownerId, ownerName }, "Room was created");

    return room;
  }

  joinRoom(id: string, user: User): Room {
    const roomId = this.validateRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(
        { roomId, userId: user.id, userName: user.name },
        "Room join was rejected",
      );
      throw new Error("Room does not exist anymore, you want to reopen it?");
    }

    const wasAlreadyInRoom = room.participants.has(user.id);
    room.addParticipant(user);

    logger.info(
      {
        roomId,
        userId: user.id,
        userName: user.name,
        rejoined: wasAlreadyInRoom,
      },
      "User joined room",
    );
    logger.info(
      { roomId, participants: room.participants.size },
      "Room participant count was updated",
    );

    return room;
  }

  castVote(id: string, userId: string, value: number | "?"): void {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(
        { roomId, userId, value },
        "Vote was rejected, room not found",
      );
      return;
    }
    if (!FIB_DECK.includes(value)) {
      logger.warn(
        { roomId, userId, value },
        "Vote was rejected, invalid value",
      );
      return;
    }

    const participant = room.recordVote(userId, value);
    if (participant) {
      const previousVote = participant.value;
      logger.info(
        {
          roomId,
          userId,
          userName: participant.name,
          value,
          previousVote,
        },
        "User cast vote",
      );

      const votedCount = Array.from(room.participants.values()).filter(
        (participantItem) => participantItem.hasVoted,
      ).length;
      logger.info(
        {
          roomId,
          votedCount,
          totalParticipants: room.participants.size,
        },
        "Vote progress was recorded",
      );
    } else {
      logger.warn({ roomId, userId }, "Vote was rejected, user not found");
    }
  }

  clearVotes(id: string): void {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({ roomId }, "Clear votes was rejected, room not found");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (participant) => participant.hasVoted,
    ).length;

    room.resetForNewRound();

    logger.info({ roomId, removedVotes: votedCount }, "Votes were cleared");
  }

  isOwner(id: string, userId: string): boolean {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    const isOwner = !!room && room.ownerId === userId;
    if (room && !isOwner) {
      logger.warn(
        { roomId, userId, ownerId: room.ownerId },
        "Access was denied, user not owner",
      );
    }
    return isOwner;
  }

  hasAnyVotes(id: string): boolean {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const hasVotes = room.hasAnyVotes();
    logger.info({ roomId, hasVotes }, "Room votes were checked");
    return hasVotes;
  }

  getState(id: string): RoomState | null {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.toState();
  }

  startReveal(id: string, namespace: PokerNamespace): void {
    const roomId = this.normalizeRoomId(id);
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({ roomId }, "Reveal was rejected, room not found");
      return;
    }

    if (!this.hasAnyVotes(roomId)) {
      logger.warn({ roomId }, "Reveal was blocked, no votes");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (participant) => participant.hasVoted,
    ).length;
    logger.info(
      {
        roomId,
        votedCount,
        totalParticipants: room.participants.size,
      },
      "Reveal was started",
    );

    const unanimousValue = room.revealCurrentRound();

    logger.info(
      {
        roomId,
        votesRevealed: room.getCurrentRoundState().votes.length,
        unanimousValue: unanimousValue ?? "none",
      },
      "Reveal was completed",
    );

    const updatedState = this.getState(roomId);
    if (updatedState) namespace.to(roomId).emit("room:state", updatedState);
  }

  leaveRoom(
    roomId: string,
    userId: string,
  ): false | { roomDeleted: boolean; wasInRoom: boolean } {
    const normalizedId = this.normalizeRoomId(roomId);
    const room = this.rooms.get(normalizedId);
    if (!room) {
      logger.warn(
        { roomId: normalizedId, userId },
        "Leave room was rejected, room not found",
      );
      return false;
    }

    const participant = room.participants.get(userId);
    const wasInRoom = room.removeParticipant(userId);

    if (wasInRoom) {
      logger.info(
        {
          roomId: normalizedId,
          userId,
          userName: participant?.name || "unknown",
        },
        "User left room",
      );
    }

    if (room.participants.size === 0) {
      this.rooms.delete(normalizedId);
      logger.info({ roomId: normalizedId }, "Room was deleted");
      return { roomDeleted: true, wasInRoom };
    }

    logger.info(
      { roomId: normalizedId, participants: room.participants.size },
      "Room participant count was updated",
    );
    return { roomDeleted: false, wasInRoom };
  }

  leaveAll(userId: string): string[] {
    logger.info({ userId }, "User disconnected from all rooms");
    const roomsToUpdate: string[] = [];
    let roomsLeft = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        const participant = room.participants.get(userId);
        room.removeParticipant(userId);
        roomsLeft++;

        logger.info(
          {
            roomId,
            userId,
            userName: participant?.name || "unknown",
          },
          "User left room",
        );

        if (room.participants.size === 0) {
          this.rooms.delete(roomId);
          logger.info({ roomId }, "Room was deleted");
        } else {
          roomsToUpdate.push(roomId);
          logger.info(
            { roomId, participants: room.participants.size },
            "Room participant count was updated",
          );
        }
      }
    }

    logger.info({ userId, roomsLeft }, "User leave summary was recorded");
    return roomsToUpdate;
  }

  updateParticipantName(
    roomId: string,
    userId: string,
    newName: string,
  ): boolean {
    const normalizedId = this.normalizeRoomId(roomId);
    const room = this.rooms.get(normalizedId);
    if (!room) {
      logger.warn(
        { roomId: normalizedId, userId },
        "Update participant name was rejected, room not found",
      );
      return false;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      logger.warn(
        { roomId: normalizedId, userId },
        "Update participant name was rejected, participant not found",
      );
      return false;
    }

    const oldName = participant.name;
    room.updateParticipantName(userId, newName);

    logger.info(
      {
        roomId: normalizedId,
        userId,
        oldName,
        newName,
      },
      "Participant name was updated",
    );

    return true;
  }
}

export default RoomManager;
