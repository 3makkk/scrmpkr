import { v4 as uuid } from "uuid";
import logger from "./logger";

export const FIB_DECK: Array<number | "?"> = [
  0,
  1,
  2,
  3,
  5,
  8,
  13,
  21,
  34,
  55,
  "?",
];

type Participant = {
  id: string;
  name: string;
  hasVoted: boolean;
  value?: number | "?";
};

type Room = {
  id: string;
  ownerId: string;
  name?: string;
  participants: Map<string, Participant>;
  status: "voting" | "revealing";
  reveals: number;
  lastRevealAt: number;
};

export class RoomManager {
  constructor() {
    this.rooms = new Map<string, Room>();
    this.roomTimeouts = new Map<string, NodeJS.Timeout>(); // Track deletion timeouts for empty rooms
    logger.info("RoomManager was initialized");
  }

  private rooms: Map<string, Room>;
  private roomTimeouts: Map<string, NodeJS.Timeout>;

  createRoom(ownerId: string, name?: string) {
    const id = uuid();
    const room: Room = {
      id,
      ownerId,
      name,
      participants: new Map<string, Participant>(),
      status: "voting",
      reveals: 0,
      lastRevealAt: Date.now(),
    };
    this.rooms.set(id, room);
    room.participants.set(ownerId, {
      id: ownerId,
      name: name || "Owner",
      hasVoted: false,
    });

    logger.info(
      { roomId: id, ownerId, ownerName: name || "Owner" },
      "Room was created"
    );
    logger.info({ totalRooms: this.rooms.size }, "Room count was updated");

    return room;
  }

  joinRoom(id: string, user: { id: string; name: string }) {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn(
        { roomId: id, userId: user.id, userName: user.name },
        "Room join was rejected"
      );
      throw new Error("Room not found");
    }

    // Cancel any pending deletion timeout for this room
    if (this.roomTimeouts.has(id)) {
      clearTimeout(this.roomTimeouts.get(id));
      this.roomTimeouts.delete(id);
      logger.info({ roomId: id }, "Room deletion timeout was cancelled");
    }

    const wasAlreadyInRoom = room.participants.has(user.id);
    room.participants.set(user.id, {
      id: user.id,
      name: user.name,
      hasVoted: false,
    });

    logger.info(
      {
        roomId: id,
        userId: user.id,
        userName: user.name,
        rejoined: wasAlreadyInRoom,
      },
      "User joined room"
    );
    logger.info(
      { roomId: id, participants: room.participants.size },
      "Room participant count was updated"
    );

    return room;
  }

  castVote(id: string, userId: string, value: number | "?") {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn(
        { roomId: id, userId, value },
        "Vote was rejected, room not found"
      );
      return;
    }
    if (!FIB_DECK.includes(value)) {
      logger.warn(
        { roomId: id, userId, value },
        "Vote was rejected, invalid value"
      );
      return;
    }

    const p = room.participants.get(userId);
    if (p) {
      const previousVote = p.value;
      p.hasVoted = true;
      p.value = value;

      logger.info(
        {
          roomId: id,
          userId,
          userName: p.name,
          value,
          previousVote,
        },
        "User cast vote"
      );

      const votedCount = Array.from(room.participants.values()).filter(
        (p) => p.hasVoted
      ).length;
      logger.info(
        {
          roomId: id,
          votedCount,
          totalParticipants: room.participants.size,
        },
        "Vote progress was recorded"
      );
    } else {
      logger.warn({ roomId: id, userId }, "Vote was rejected, user not found");
    }
  }

  clearVotes(id: string) {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn({ roomId: id }, "Clear votes was rejected, room not found");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (p) => p.hasVoted
    ).length;
    room.status = "voting";
    for (const p of room.participants.values()) {
      p.hasVoted = false;
      delete p.value;
    }

    logger.info({ roomId: id, removedVotes: votedCount }, "Votes were cleared");
  }

  isOwner(id: string, userId: string) {
    const room = this.rooms.get(id);
    const isOwner = room && room.ownerId === userId;
    if (room && !isOwner) {
      logger.warn(
        { roomId: id, userId, ownerId: room.ownerId },
        "Access was denied, user not owner"
      );
    }
    return isOwner;
  }

  hasAnyVotes(id: string) {
    const room = this.rooms.get(id);
    if (!room) return false;
    const hasVotes = Array.from(room.participants.values()).some(
      (p) => p.hasVoted
    );
    logger.info({ roomId: id, hasVotes }, "Room votes were checked");
    return hasVotes;
  }

  scheduleRoomDeletion(roomId: string) {
    // Schedule room deletion after 30 seconds of being empty
    const timeout = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (room && room.participants.size === 0) {
        this.rooms.delete(roomId);
        this.roomTimeouts.delete(roomId);
        logger.info({ roomId }, "Room was deleted after timeout");
        logger.info({ totalRooms: this.rooms.size }, "Room count was updated");
      }
    }, 30000); // 30 seconds

    this.roomTimeouts.set(roomId, timeout);
    logger.info({ roomId }, "Room deletion was scheduled");
  }

  cleanup() {
    // Clear all pending timeouts
    for (const timeout of this.roomTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.roomTimeouts.clear();
    logger.info("Room deletion timeouts were cleared");
  }

  getState(id: string) {
    const room = this.rooms.get(id);
    if (!room) return null;
    return {
      id: room.id,
      ownerId: room.ownerId,
      participants: Array.from(room.participants.values()).map((p) => ({
        id: p.id,
        name: p.name,
        hasVoted: p.hasVoted,
      })),
      status: room.status,
    };
  }

  getProgress(id: string) {
    const room = this.rooms.get(id);
    if (!room) return null;
    const result: Record<string, boolean> = {};
    for (const [id, p] of room.participants) result[id] = p.hasVoted;
    return result;
  }

  startReveal(id: string, namespace: any) {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn({ roomId: id }, "Reveal was rejected, room not found");
      return;
    }

    // Check if anyone has voted before allowing reveal
    const hasAnyVotes = Array.from(room.participants.values()).some(
      (p) => p.hasVoted
    );
    if (!hasAnyVotes) {
      logger.warn({ roomId: id }, "Reveal was blocked, no votes");
      return; // Don't start reveal if no one has voted
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (p) => p.hasVoted
    ).length;
    logger.info(
      {
        roomId: id,
        votedCount,
        totalParticipants: room.participants.size,
      },
      "Reveal was started"
    );

    room.status = "revealing";
    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      logger.info({ roomId: id, remaining }, "Reveal countdown ticked");
      namespace.to(id).emit("reveal:countdown", { remaining });
      if (remaining <= 0) {
        clearInterval(interval);
        room.status = "voting";
        room.reveals += 1;
        room.lastRevealAt = Date.now();
        const revealed = Array.from(room.participants.values()).map((p) => ({
          id: p.id,
          value: p.value,
        }));
        const vals = revealed
          .filter((v) => v.value !== "?" && v.value !== undefined)
          .map((v) => v.value as number);
        const unique = [...new Set(vals)];
        const unanimousValue: number | undefined =
          unique.length === 1 && vals.length > 0 ? unique[0] : undefined;

        logger.info(
          {
            roomId: id,
            totalReveals: room.reveals,
            votesRevealed: revealed.length,
            unanimousValue: unanimousValue || "none",
          },
          "Reveal was completed"
        );

        namespace
          .to(id)
          .emit("reveal:complete", { revealedVotes: revealed, unanimousValue });
      }
    }, 1000);
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(
        { roomId, userId },
        "Leave room was rejected, room not found"
      );
      return false;
    }

    const participant = room.participants.get(userId);
    const wasInRoom = room.participants.has(userId);
    room.participants.delete(userId);

    if (wasInRoom) {
      logger.info(
        {
          roomId,
          userId,
          userName: participant?.name || "unknown",
        },
        "User left room"
      );
    }

    // If room is empty, schedule it for deletion instead of immediate deletion
    if (room.participants.size === 0) {
      this.scheduleRoomDeletion(roomId);
      return { roomDeleted: false, wasInRoom, scheduled: true };
    }

    logger.info(
      { roomId, participants: room.participants.size },
      "Room participant count was updated"
    );
    return { roomDeleted: false, wasInRoom, scheduled: false };
  }

  leaveAll(userId: string) {
    logger.info({ userId }, "User disconnected from all rooms");
    const roomsToUpdate: string[] = [];
    let roomsLeft = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        const participant = room.participants.get(userId);
        room.participants.delete(userId);
        roomsLeft++;

        logger.info(
          {
            roomId,
            userId,
            userName: participant?.name || "unknown",
          },
          "User left room"
        );

        // If room is empty, schedule it for deletion instead of immediate deletion
        if (room.participants.size === 0) {
          this.scheduleRoomDeletion(roomId);
        } else {
          roomsToUpdate.push(roomId);
          logger.info(
            { roomId, participants: room.participants.size },
            "Room participant count was updated"
          );
        }
      }
    }

    logger.info(
      { userId, roomsLeft, totalRooms: this.rooms.size },
      "User leave summary was recorded"
    );
    return roomsToUpdate; // Return room IDs that need state updates
  }
}

export default RoomManager;
