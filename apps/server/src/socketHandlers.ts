import {
  type ClientToServerEvents,
  isUserRole,
  MAX_NAME_LENGTH,
  type ServerToClientEvents,
  UserRole,
} from "@scrmpkr/shared";
import type { Namespace } from "socket.io";
import logger from "./logger.js";
import type { RoomManager } from "./roomManager.js";
import type { User } from "./types.js";

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: User;
  // The room this socket has joined. A user is in at most one room, and
  // in-room events act on this room instead of a client-supplied id.
  roomId?: string;
}

export type PokerNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type EventName = keyof ClientToServerEvents;
// The ack callback of an event, or never for events without one.
type AckOf<E extends EventName> = Extract<
  Parameters<ClientToServerEvents[E]>[number],
  (...args: never[]) => void
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const noop = () => {};

export function registerPokerHandlers(
  namespace: PokerNamespace,
  rooms: RoomManager,
): void {
  // Track active sockets per user to enforce single connection per userId
  const activeSockets = new Map<string, string>();

  namespace.on("connection", (socket) => {
    const transport = socket.conn.transport.name; // in most cases, "polling"
    const { id: userId, name: userName } = socket.data.user;

    // Create a child logger with user context
    const userLogger = logger.child({ userId, userName });

    userLogger.info({ transport }, "Socket connected");

    // Enforce single active connection per userId by disconnecting the previous one
    const existingSocketId = activeSockets.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = namespace.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit("force:disconnect", {
          reason: "Another session connected with your account",
        });
        existingSocket.disconnect(true);
        userLogger.info(
          { kickedSocketId: existingSocketId },
          "Disconnected previous socket for user",
        );
      }
    }
    activeSockets.set(userId, socket.id);

    socket.conn.on("upgrade", () => {
      const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
      userLogger.info({ transport: upgradedTransport }, "Socket upgraded");
    });

    userLogger.info({ socketId: socket.id }, "User connected");

    // Payloads come straight from the client, so handlers get them as
    // unknown, an ack that is always callable, and a try/catch: socket.io does
    // not catch errors thrown in handlers, so one malformed packet would
    // otherwise crash the whole process.
    const on = <E extends EventName>(
      event: E,
      handler: (data: unknown, ack: AckOf<E>) => void,
    ) => {
      const listener = (...args: unknown[]) => {
        const last = args.at(-1);
        const ack = (typeof last === "function" ? last : noop) as AckOf<E>;
        try {
          handler(args[0], ack);
        } catch (error) {
          const e = error instanceof Error ? error : new Error(String(error));
          userLogger.error(
            { event, error: e.message },
            "Socket handler failed",
          );
        }
      };
      socket.on(event, listener as never);
    };

    const broadcastState = (roomId: string) => {
      const state = rooms.getState(roomId);
      if (state) namespace.to(state.id).emit("room:state", state);
    };

    // Leave the socket's room (participant list and socket.io room) and tell
    // the remaining participants. Returns whether the user was in a room.
    const leaveCurrentRoom = (): boolean => {
      const { roomId } = socket.data;
      if (!roomId) return false;
      socket.data.roomId = undefined;
      socket.leave(roomId);
      const result = rooms.leaveRoom(roomId, userId);
      if (result && !result.roomDeleted) broadcastState(roomId);
      userLogger.child({ roomId }).info("User left socket room");
      return result !== false && result.wasInRoom;
    };

    on("room:exists", (data, ack) => {
      ack({
        exists:
          isRecord(data) &&
          typeof data.roomId === "string" &&
          rooms.roomExists(data.roomId),
      });
    });

    on("room:join", (data, ack) => {
      if (!isRecord(data) || typeof data.roomId !== "string") {
        ack({ error: "Invalid room" });
        return;
      }
      const role = data.role ?? UserRole.PARTICIPANT;
      if (!isUserRole(role)) {
        ack({ error: "Invalid role" });
        return;
      }
      const roomLogger = userLogger.child({ roomId: data.roomId, role });
      try {
        const room = rooms.roomExists(data.roomId)
          ? rooms.joinRoom(data.roomId, socket.data.user, role)
          : rooms.createRoom(data.roomId, socket.data.user, role);
        // Joining another room leaves the previous one, so the user doesn't
        // stay behind as a ghost participant.
        if (socket.data.roomId !== room.id) leaveCurrentRoom();
        socket.data.roomId = room.id;
        socket.join(room.id);
        roomLogger.info("User joined socket room");
        const state = room.toState();
        ack({ state });
        socket.to(room.id).emit("room:state", state);
      } catch (error) {
        const e = error as Error;
        roomLogger.warn({ error: e.message }, "Room join failed");
        ack({ error: e.message });
      }
    });

    on("room:leave", (_data, ack) => {
      ack({ success: leaveCurrentRoom() });
    });

    on("user:updateName", (data, ack) => {
      const newName =
        isRecord(data) && typeof data.newName === "string"
          ? data.newName.trim()
          : "";
      if (!newName || newName.length > MAX_NAME_LENGTH) {
        ack({ error: "Invalid name" });
        return;
      }
      userLogger.info(
        { oldName: socket.data.user.name, newName },
        "Name updated",
      );
      socket.data.user.name = newName;
      const { roomId } = socket.data;
      if (roomId && rooms.updateParticipantName(roomId, userId, newName)) {
        broadcastState(roomId);
      }
      ack({ success: true });
    });

    on("user:updateRole", (data, ack) => {
      const { roomId } = socket.data;
      if (!isRecord(data) || !isUserRole(data.newRole)) {
        ack({ error: "Invalid role" });
        return;
      }
      if (
        !roomId ||
        !rooms.updateParticipantRole(roomId, userId, data.newRole)
      ) {
        ack({ error: "User not found in room" });
        return;
      }
      broadcastState(roomId);
      ack({ success: true });
    });

    on("vote:cast", (data) => {
      const { roomId } = socket.data;
      if (
        roomId &&
        isRecord(data) &&
        rooms.castVote(roomId, userId, data.value)
      ) {
        broadcastState(roomId);
      }
    });

    on("reveal:start", () => {
      const { roomId } = socket.data;
      if (roomId && rooms.startReveal(roomId, userId)) broadcastState(roomId);
    });

    on("vote:clear", () => {
      const { roomId } = socket.data;
      // Only tell clients to drop their selected card when the clear actually
      // happened; a rejected clear (e.g. a visitor) must not wipe their UI.
      if (!roomId || !rooms.clearVotes(roomId, userId)) return;
      namespace.to(roomId).emit("votes:cleared");
      broadcastState(roomId);
    });

    socket.on("disconnect", () => {
      userLogger.info({ socketId: socket.id }, "User disconnected");
      // Only the user's active socket owns their room membership. A stale
      // socket that closes late (e.g. after a ping timeout) must not remove
      // the user from a room their new socket has already rejoined.
      if (activeSockets.get(userId) !== socket.id) return;
      activeSockets.delete(userId);
      leaveCurrentRoom();
    });
  });
}
