import { v4 as uuid } from "uuid";

export const FIB_DECK: Array<number | "?"> = [
  0, 1, 2, 3, 5, 8, 13, 21, 34, 55, "?",
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
    console.log("🏠 RoomManager initialized");
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

    console.log(
      `🎯 Room created: ${id} by user ${ownerId} (${name || "Owner"})`
    );
    console.log(`📊 Total rooms: ${this.rooms.size}`);

    return room;
  }

  joinRoom(id: string, user: { id: string; name: string }) {
    const room = this.rooms.get(id);
    if (!room) {
      console.log(
        `❌ Failed to join room ${id}: Room not found (user: ${user.id}/${user.name})`
      );
      throw new Error("Room not found");
    }

    // Cancel any pending deletion timeout for this room
    if (this.roomTimeouts.has(id)) {
      clearTimeout(this.roomTimeouts.get(id));
      this.roomTimeouts.delete(id);
      console.log(
        `⏰ Cancelled deletion timeout for room ${id} - user rejoined`
      );
    }

    const wasAlreadyInRoom = room.participants.has(user.id);
    room.participants.set(user.id, {
      id: user.id,
      name: user.name,
      hasVoted: false,
    });

    console.log(
      `👋 User ${user.id} (${user.name}) ${
        wasAlreadyInRoom ? "rejoined" : "joined"
      } room ${id}`
    );
    console.log(`👥 Room ${id} now has ${room.participants.size} participants`);

    return room;
  }

  castVote(id: string, userId: string, value: number | "?") {
    const room = this.rooms.get(id);
    if (!room) {
      console.log(
        `❌ Vote failed: Room ${id} not found (user: ${userId}, value: ${value})`
      );
      return;
    }
    if (!FIB_DECK.includes(value)) {
      console.log(
        `❌ Vote failed: Invalid value ${value} (user: ${userId}, room: ${id})`
      );
      return;
    }

    const p = room.participants.get(userId);
    if (p) {
      const previousVote = p.value;
      p.hasVoted = true;
      p.value = value;

      console.log(
        `🗳️  User ${userId} (${p.name}) voted ${value} in room ${id}${
          previousVote ? ` (changed from ${previousVote})` : ""
        }`
      );

      const votedCount = Array.from(room.participants.values()).filter(
        (p) => p.hasVoted
      ).length;
      console.log(
        `📈 Room ${id}: ${votedCount}/${room.participants.size} participants have voted`
      );
    } else {
      console.log(`❌ Vote failed: User ${userId} not found in room ${id}`);
    }
  }

  clearVotes(id: string) {
    const room = this.rooms.get(id);
    if (!room) {
      console.log(`❌ Clear votes failed: Room ${id} not found`);
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

    console.log(`🧹 Votes cleared in room ${id} (${votedCount} votes removed)`);
  }

  isOwner(id: string, userId: string) {
    const room = this.rooms.get(id);
    const isOwner = room && room.ownerId === userId;
    if (room && !isOwner) {
      console.log(
        `🚫 Access denied: User ${userId} is not owner of room ${id} (owner: ${room.ownerId})`
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
    console.log(
      `🔍 Room ${id} vote check: ${hasVotes ? "has votes" : "no votes yet"}`
    );
    return hasVotes;
  }

  scheduleRoomDeletion(roomId: string) {
    // Schedule room deletion after 30 seconds of being empty
    const timeout = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (room && room.participants.size === 0) {
        this.rooms.delete(roomId);
        this.roomTimeouts.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted after timeout (empty)`);
        console.log(`📊 Total rooms: ${this.rooms.size}`);
      }
    }, 30000); // 30 seconds

    this.roomTimeouts.set(roomId, timeout);
    console.log(`⏰ Room ${roomId} scheduled for deletion in 30 seconds`);
  }

  cleanup() {
    // Clear all pending timeouts
    for (const timeout of this.roomTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.roomTimeouts.clear();
    console.log("🧹 All room deletion timeouts cleared");
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
      console.log(`❌ Reveal failed: Room ${id} not found`);
      return;
    }

    // Check if anyone has voted before allowing reveal
    const hasAnyVotes = Array.from(room.participants.values()).some(
      (p) => p.hasVoted
    );
    if (!hasAnyVotes) {
      console.log(`❌ Reveal blocked: No votes in room ${id}`);
      return; // Don't start reveal if no one has voted
    }

    const votedCount = Array.from(room.participants.values()).filter(
      (p) => p.hasVoted
    ).length;
    console.log(
      `🎭 Starting reveal for room ${id} (${votedCount}/${room.participants.size} voted)`
    );

    room.status = "revealing";
    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      console.log(`⏱️  Room ${id} reveal countdown: ${remaining}`);
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

        console.log(`🎉 Reveal complete for room ${id}:`, {
          totalReveals: room.reveals,
          votesRevealed: revealed.length,
          unanimousValue: unanimousValue || "none",
        });

        namespace
          .to(id)
          .emit("reveal:complete", { revealedVotes: revealed, unanimousValue });
      }
    }, 1000);
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(
        `❌ Leave room failed: Room ${roomId} not found (user: ${userId})`
      );
      return false;
    }

    const participant = room.participants.get(userId);
    const wasInRoom = room.participants.has(userId);
    room.participants.delete(userId);

    if (wasInRoom) {
      console.log(
        `🚪 User ${userId} (${
          participant?.name || "unknown"
        }) left room ${roomId}`
      );
    }

    // If room is empty, schedule it for deletion instead of immediate deletion
    if (room.participants.size === 0) {
      this.scheduleRoomDeletion(roomId);
      return { roomDeleted: false, wasInRoom, scheduled: true };
    }

    console.log(
      `👥 Room ${roomId} now has ${room.participants.size} participants`
    );
    return { roomDeleted: false, wasInRoom, scheduled: false };
  }

  leaveAll(userId: string) {
    console.log(`🚶 User ${userId} disconnecting from all rooms`);
    const roomsToUpdate: string[] = [];
    let roomsLeft = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        const participant = room.participants.get(userId);
        room.participants.delete(userId);
        roomsLeft++;

        console.log(
          `🚪 User ${userId} (${
            participant?.name || "unknown"
          }) left room ${roomId}`
        );

        // If room is empty, schedule it for deletion instead of immediate deletion
        if (room.participants.size === 0) {
          this.scheduleRoomDeletion(roomId);
        } else {
          roomsToUpdate.push(roomId);
          console.log(
            `👥 Room ${roomId} now has ${room.participants.size} participants`
          );
        }
      }
    }

    console.log(
      `📊 User ${userId} left ${roomsLeft} rooms. Total rooms: ${this.rooms.size}`
    );
    return roomsToUpdate; // Return room IDs that need state updates
  }
}

export default RoomManager;
