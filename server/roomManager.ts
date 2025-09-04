import { randomUUID } from "node:crypto";
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
  status: "voting";
};

export type User = {
  id: string;
  name: string;
};

export type RoomState = {
  id: string;
  ownerId: string;
  participants: Array<{ id: string; name: string; hasVoted: boolean }>;
  status: "voting";
};

export type VoteProgress = Record<string, boolean>;
export type RevealedVote = { id: string; value?: number | "?" };

export type PokerNamespace = {
  to(roomId: string): {
    emit: {
      (
        ev: "reveal:complete",
        payload: { revealedVotes: RevealedVote[]; unanimousValue?: number },
      ): boolean;
      (ev: "room:state", state: RoomState): boolean;
      (ev: "vote:progress", progress: VoteProgress): boolean;
      (ev: "votes:cleared"): boolean;
    };
  };
};

export class RoomManager {
  constructor() {
    this.rooms = new Map<string, Room>();
    logger.info("RoomManager was initialized");
  }

  private rooms: Map<string, Room>;

  createRoom(ownerId: string, name?: string): Room {
    const id = randomUUID();
    const room: Room = {
      id,
      ownerId,
      name,
      participants: new Map<string, Participant>(),
      status: "voting",
    };
    this.rooms.set(id, room);
    room.participants.set(ownerId, {
      id: ownerId,
      name: name || "Owner",
      hasVoted: false,
    });

    logger.info(
      { roomId: id, ownerId, ownerName: name || "Owner" },
      "Room was created",
    );

    return room;
  }

  joinRoom(id: string, user: User): Room {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn(
        { roomId: id, userId: user.id, userName: user.name },
        "Room join was rejected",
      );
      throw new Error("Room not found");
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
      "User joined room",
    );
    logger.info(
      { roomId: id, participants: room.participants.size },
      "Room participant count was updated",
    );

    return room;
  }

  castVote(id: string, userId: string, value: number | "?"): void {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn(
        { roomId: id, userId, value },
        "Vote was rejected, room not found",
      );
      return;
    }
    if (!FIB_DECK.includes(value)) {
      logger.warn(
        { roomId: id, userId, value },
        "Vote was rejected, invalid value",
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
        "User cast vote",
      );

      const votedCount = Array.from(room.participants.values()).filter(
        (p) => p.hasVoted,
      ).length;
      logger.info(
        {
          roomId: id,
          votedCount,
          totalParticipants: room.participants.size,
        },
        "Vote progress was recorded",
      );
    } else {
      logger.warn({ roomId: id, userId }, "Vote was rejected, user not found");
    }
  }

  clearVotes(id: string): void {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn({ roomId: id }, "Clear votes was rejected, room not found");
      return;
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (p) => p.hasVoted,
    ).length;
    for (const p of room.participants.values()) {
      p.hasVoted = false;
      delete p.value;
    }

    logger.info({ roomId: id, removedVotes: votedCount }, "Votes were cleared");
  }

  isOwner(id: string, userId: string): boolean {
    const room = this.rooms.get(id);
    const isOwner = !!room && room.ownerId === userId;
    if (room && !isOwner) {
      logger.warn(
        { roomId: id, userId, ownerId: room.ownerId },
        "Access was denied, user not owner",
      );
    }
    return isOwner;
  }

  hasAnyVotes(id: string): boolean {
    const room = this.rooms.get(id);
    if (!room) return false;
    const hasVotes = Array.from(room.participants.values()).some(
      (p) => p.hasVoted,
    );
    logger.info({ roomId: id, hasVotes }, "Room votes were checked");
    return hasVotes;
  }

  getState(id: string): RoomState | null {
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

  getProgress(id: string): VoteProgress | null {
    const room = this.rooms.get(id);
    if (!room) return null;
    const result: VoteProgress = {};
    for (const [id, p] of room.participants) result[id] = p.hasVoted;
    return result;
  }

  startReveal(id: string, namespace: PokerNamespace): void {
    const room = this.rooms.get(id);
    if (!room) {
      logger.warn({ roomId: id }, "Reveal was rejected, room not found");
      return;
    }

    // Check if anyone has voted before allowing reveal
    const hasAnyVotes = Array.from(room.participants.values()).some(
      (p) => p.hasVoted,
    );
    if (!hasAnyVotes) {
      logger.warn({ roomId: id }, "Reveal was blocked, no votes");
      return; // Don't start reveal if no one has voted
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (p) => p.hasVoted,
    ).length;
    logger.info(
      {
        roomId: id,
        votedCount,
        totalParticipants: room.participants.size,
      },
      "Reveal was started",
    );

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
        votesRevealed: revealed.length,
        unanimousValue: unanimousValue || "none",
      },
      "Reveal was completed",
    );

    namespace
      .to(id)
      .emit("reveal:complete", { revealedVotes: revealed, unanimousValue });
  }

  leaveRoom(
    roomId: string,
    userId: string,
  ): false | { roomDeleted: boolean; wasInRoom: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(
        { roomId, userId },
        "Leave room was rejected, room not found",
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
        "User left room",
      );
    }

    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
      logger.info({ roomId }, "Room was deleted");
      return { roomDeleted: true, wasInRoom };
    }

    logger.info(
      { roomId, participants: room.participants.size },
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
        room.participants.delete(userId);
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
    return roomsToUpdate; // Return room IDs that need state updates
  }
}

export default RoomManager;
