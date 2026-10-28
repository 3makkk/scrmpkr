import "dotenv/config";
import "./metrics.js";
import http from "node:http";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  UserRole,
} from "@scrmpkr/shared";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import logger from "./logger.js";
import { setMetricCallbacks } from "./metrics.js";
import { RoomManager, type RoomState, type User } from "./roomManager.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

type InterServerEvents = Record<string, never>;

interface SocketData {
  user: User;
}

// Track active sockets per user to enforce single connection per userId
const activeSockets = new Map<string, string>();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

// Register metric callbacks for OTEL gauges
setMetricCallbacks(
  () => rooms.getRoomsCount(),
  () => rooms.getTotalActiveUsers(),
);

type AuthPayload = { name?: string; userId?: string };

const namespace = io.of("/poker");
namespace.use(async (socket, next) => {
  try {
    const { name, userId } = (socket.handshake.auth || {}) as AuthPayload;
    if (name && userId) {
      socket.data.user = { id: String(userId), name: String(name) };
      logger.info(
        { userId, userName: name },
        "User authenticated with credentials",
      );
    } else {
      logger.warn("Authentication failed, no credentials provided");
      throw new Error("No auth");
    }
    next();
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    logger.error({ error: e.message }, "Authentication error occurred");
    next(e);
  }
});

const VALID_ROLES = new Set<string>(Object.values(UserRole));
const MAX_NAME_LENGTH = 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isRoomPayload = (data: unknown): data is { roomId: string } =>
  isRecord(data) && typeof data.roomId === "string";

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && VALID_ROLES.has(value);

// Payloads come straight from the client. Socket.io does not catch errors
// thrown in event handlers, so a single malformed packet (missing ack, wrong
// payload shape) would otherwise crash the whole process.
function safeHandler<Args extends unknown[]>(
  eventLogger: typeof logger,
  event: string,
  handler: (...args: Args) => void,
): (...args: Args) => void {
  return (...args: Args) => {
    try {
      handler(...args);
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      eventLogger.error({ event, error: e.message }, "Socket handler failed");
    }
  };
}

const ackOrNoop = <T>(cb: unknown): ((resp: T) => void) =>
  typeof cb === "function" ? (cb as (resp: T) => void) : () => {};

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

  const broadcastState = (roomId: string) => {
    const state = rooms.getState(roomId);
    if (state) namespace.to(state.id).emit("room:state", state);
  };

  // Remove the user from a room (participant list and socket.io room) and
  // tell the remaining participants.
  const leaveRoomAndNotify = (roomId: string) => {
    const result = rooms.leaveRoom(roomId, socket.data.user.id);
    socket.leave(roomId.trim().toLowerCase());
    if (result && !result.roomDeleted) broadcastState(roomId);
    return result;
  };

  socket.on(
    "room:exists",
    safeHandler(userLogger, "room:exists", (data, cb) => {
      const ack = ackOrNoop<{ exists: boolean }>(cb);
      ack({ exists: isRoomPayload(data) && rooms.roomExists(data.roomId) });
    }),
  );

  socket.on(
    "room:join",
    safeHandler(userLogger, "room:join", (data, cb) => {
      const ack = ackOrNoop<{ state: RoomState } | { error: string }>(cb);
      if (!isRoomPayload(data)) {
        ack({ error: "Invalid room" });
        return;
      }
      const role = data.role ?? UserRole.PARTICIPANT;
      if (!isUserRole(role)) {
        ack({ error: "Invalid role" });
        return;
      }
      const { roomId } = data;
      const roomLogger = userLogger.child({ roomId, role });
      try {
        // A user is in at most one room: drop any room they are still part of
        // (e.g. navigated away without leaving), otherwise they stay a ghost
        // participant there and keep receiving that room's state.
        const normalizedRoomId = roomId.trim().toLowerCase();
        for (const otherRoomId of rooms.findUserRooms(socket.data.user.id)) {
          if (otherRoomId !== normalizedRoomId) leaveRoomAndNotify(otherRoomId);
        }
        for (const joinedRoom of socket.rooms) {
          if (joinedRoom !== socket.id && joinedRoom !== normalizedRoomId) {
            socket.leave(joinedRoom);
          }
        }

        const room = rooms.roomExists(roomId)
          ? rooms.joinRoom(roomId, socket.data.user, role)
          : rooms.createRoom(roomId, socket.data.user, role);
        socket.join(room.id);
        roomLogger.info("User joined socket room");
        const state = rooms.getState(room.id);
        if (state) {
          ack({ state });
          socket.to(room.id).emit("room:state", state);
        } else {
          ack({ error: "Room not found" });
        }
      } catch (error) {
        const e = error as Error;
        roomLogger.warn({ error: e.message }, "Room join failed");
        ack({ error: e.message });
      }
    }),
  );

  socket.on(
    "room:leave",
    safeHandler(userLogger, "room:leave", (data, cb) => {
      const ack = ackOrNoop<{ success: boolean }>(cb);
      if (!isRoomPayload(data)) {
        ack({ success: false });
        return;
      }
      const roomLogger = userLogger.child({ roomId: data.roomId });
      const result = leaveRoomAndNotify(data.roomId);
      if (result !== false && result.wasInRoom) {
        roomLogger.info("User left socket room");
        ack({ success: true });
      } else {
        roomLogger.warn("Leave failed, user not in room");
        ack({ success: false });
      }
    }),
  );

  socket.on(
    "user:updateName",
    safeHandler(userLogger, "user:updateName", (data, cb) => {
      const ack = ackOrNoop<{ success: boolean } | { error: string }>(cb);
      if (!isRoomPayload(data) || typeof data.newName !== "string") {
        ack({ error: "Invalid payload" });
        return;
      }
      const newName = data.newName.trim();
      if (!newName || newName.length > MAX_NAME_LENGTH) {
        ack({ error: "Invalid name" });
        return;
      }
      const { roomId } = data;
      const roomLogger = userLogger.child({
        roomId,
        oldName: socket.data.user.name,
        newName,
      });

      // Update the socket's user data
      socket.data.user.name = newName;

      // Update the room participant with new name
      const success = rooms.updateParticipantName(
        roomId,
        socket.data.user.id,
        newName,
      );
      if (success) {
        broadcastState(roomId);
        ack({ success: true });
      } else {
        roomLogger.warn("Username update failed - user not in room");
        ack({ error: "User not found in room" });
      }
    }),
  );

  socket.on(
    "user:updateRole",
    safeHandler(userLogger, "user:updateRole", (data, cb) => {
      const ack = ackOrNoop<{ success: boolean } | { error: string }>(cb);
      if (!isRoomPayload(data) || !isUserRole(data.newRole)) {
        ack({ error: "Invalid payload" });
        return;
      }
      const { roomId, newRole } = data;
      const roomLogger = userLogger.child({ roomId, newRole });
      const success = rooms.updateParticipantRole(
        roomId,
        socket.data.user.id,
        newRole,
      );
      if (success) {
        broadcastState(roomId);
        ack({ success: true });
      } else {
        roomLogger.warn("Role update failed - user not in room");
        ack({ error: "User not found in room" });
      }
    }),
  );

  socket.on(
    "vote:cast",
    safeHandler(userLogger, "vote:cast", (data) => {
      if (!isRoomPayload(data)) return;
      rooms.castVote(data.roomId, socket.data.user.id, data.value);
      broadcastState(data.roomId);
    }),
  );

  socket.on(
    "reveal:start",
    safeHandler(userLogger, "reveal:start", (data) => {
      if (!isRoomPayload(data)) return;
      const { roomId } = data;
      const roomLogger = userLogger.child({ roomId });
      // Check if there are votes to reveal
      if (!rooms.hasAnyVotes(roomId)) {
        roomLogger.warn("Reveal was denied, no votes");
        return; // Don't allow reveal if no votes
      }
      rooms.startReveal(roomId, socket.data.user.id, namespace);
    }),
  );

  socket.on(
    "vote:clear",
    safeHandler(userLogger, "vote:clear", (data) => {
      if (!isRoomPayload(data)) return;
      const { roomId } = data;
      // Only tell clients to drop their selected card when the clear actually
      // happened; a rejected clear (e.g. a visitor) must not wipe their UI.
      if (!rooms.clearVotes(roomId, socket.data.user.id)) return;
      const normalizedRoomId = roomId.trim().toLowerCase();
      namespace.to(normalizedRoomId).emit("votes:cleared");
      broadcastState(roomId);
    }),
  );

  socket.on(
    "disconnect",
    safeHandler(userLogger, "disconnect", () => {
      userLogger.info({ socketId: socket.id }, "User disconnected");
      // Only the user's active socket owns their room membership. A stale
      // socket that closes late (e.g. after a ping timeout) must not remove
      // the user from a room their new socket has already rejoined.
      if (activeSockets.get(socket.data.user.id) !== socket.id) return;
      activeSockets.delete(socket.data.user.id);

      for (const roomId of rooms.findUserRooms(socket.data.user.id)) {
        leaveRoomAndNotify(roomId);
        userLogger.child({ roomId }).info("Room state update was sent");
      }
    }),
  );
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
