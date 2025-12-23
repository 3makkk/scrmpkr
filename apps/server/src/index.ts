import "dotenv/config";
import "./metrics.js";
import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { RoomManager, type User, type RoomState } from "./roomManager.js";
import type { UserRole } from "@scrmpkr/shared";
import logger from "./logger.js";
import { setMetricCallbacks } from "./metrics.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "votes:cleared": () => void;
  "force:disconnect": (data: { reason: string }) => void;
}

interface ClientToServerEvents {
  "room:exists": (
    data: { roomId: string },
    cb: (resp: { exists: boolean }) => void
  ) => void;
  "room:join": (
    data: { roomId: string; role: UserRole },
    cb: (resp: { state: RoomState } | { error: string }) => void
  ) => void;
  "room:leave": (
    data: { roomId: string },
    cb?: (resp: { success: boolean }) => void
  ) => void;
  "user:updateName": (
    data: { roomId: string; newName: string },
    cb?: (resp: { success: boolean } | { error: string }) => void
  ) => void;
  "vote:cast": (data: { roomId: string; value: number | "?" }) => void;
  "reveal:start": (data: { roomId: string }) => void;
  "vote:clear": (data: { roomId: string }) => void;
}

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
  () => rooms.getTotalActiveUsers()
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
        "User authenticated with credentials"
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
        "Disconnected previous socket for user"
      );
    }
  }
  activeSockets.set(userId, socket.id);

  socket.conn.on("upgrade", () => {
    const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
    userLogger.info({ transport: upgradedTransport }, "Socket upgraded");
  });

  userLogger.info({ socketId: socket.id }, "User connected");

  socket.on("room:exists", ({ roomId }, cb) => {
    const exists = rooms.roomExists(roomId);
    cb({ exists });
  });

  socket.on("room:join", ({ roomId, role }, cb) => {
    const roomLogger = userLogger.child({ roomId, role });
    try {
      const room = rooms.roomExists(roomId)
        ? rooms.joinRoom(roomId, socket.data.user, role)
        : rooms.createRoom(roomId, socket.data.user, role);
      socket.join(room.id);
      roomLogger.info("User joined socket room");
      const state = rooms.getState(room.id);
      if (state) {
        cb({ state });
        namespace.to(room.id).emit("room:state", state);
      } else {
        cb({ error: "Room not found" });
      }
    } catch (error) {
      const e = error as Error;
      roomLogger.warn({ error: e.message }, "Room join failed");
      cb({ error: e.message });
    }
  });

  socket.on("room:leave", ({ roomId }, cb) => {
    const roomLogger = userLogger.child({ roomId });
    const result = rooms.leaveRoom(roomId, socket.data.user.id);
    if (result !== false && result.wasInRoom) {
      const normalizedRoomId = roomId.trim().toLowerCase();
      socket.leave(normalizedRoomId);
      roomLogger.info("User left socket room");
      // Notify other participants about the updated room state
      {
        const state = rooms.getState(roomId);
        if (state) namespace.to(state.id).emit("room:state", state);
      }
      if (cb) cb({ success: true });
    } else {
      roomLogger.warn("Leave failed, user not in room");
      if (cb) cb({ success: false });
    }
  });

  socket.on("user:updateName", ({ roomId, newName }, cb) => {
    const roomLogger = userLogger.child({
      roomId,
      oldName: socket.data.user.name,
      newName,
    });
    try {
      // Update the socket's user data
      socket.data.user.name = newName;

      // Update the room participant with new name
      const success = rooms.updateParticipantName(
        roomId,
        socket.data.user.id,
        newName
      );
      if (success) {
        // Broadcast updated room state to all participants
        const state = rooms.getState(roomId);
        if (state) namespace.to(state.id).emit("room:state", state);

        if (cb) cb({ success: true });
      } else {
        roomLogger.warn("Username update failed - user not in room");
        if (cb) cb({ error: "User not found in room" });
      }
    } catch (error) {
      const e = error as Error;
      roomLogger.error({ error: e.message }, "Username update failed");
      if (cb) cb({ error: e.message });
    }
  });

  socket.on("vote:cast", ({ roomId, value }) => {
    rooms.castVote(roomId, socket.data.user.id, value);
    const state = rooms.getState(roomId);
    if (state) namespace.to(state.id).emit("room:state", state);
  });

  socket.on("reveal:start", ({ roomId }) => {
    const roomLogger = userLogger.child({ roomId });
    // Check if there are votes to reveal
    if (!rooms.hasAnyVotes(roomId)) {
      roomLogger.warn("Reveal was denied, no votes");
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, socket.data.user.id, namespace);
  });

  socket.on("vote:clear", ({ roomId }) => {
    rooms.clearVotes(roomId, socket.data.user.id);
    // Notify clients that votes were cleared, and broadcast fresh state
    const normalizedRoomId = roomId.trim().toLowerCase();
    namespace.to(normalizedRoomId).emit("votes:cleared");
    {
      const state = rooms.getState(roomId);
      if (state) namespace.to(state.id).emit("room:state", state);
    }
  });

  socket.on("disconnect", () => {
    userLogger.info({ socketId: socket.id }, "User disconnected");
    // Clear active socket tracking if this was the registered one for the user
    if (activeSockets.get(socket.data.user.id) === socket.id) {
      activeSockets.delete(socket.data.user.id);
    }

    // Remove user from their room if they're in one
    const roomId = rooms.findUserRoom(socket.data.user.id);
    if (roomId) {
      const result = rooms.leaveRoom(roomId, socket.data.user.id);
      // Emit updated state if room still exists
      if (result && !result.roomDeleted) {
        userLogger.child({ roomId }).info("Room state update was sent");
        const state = rooms.getState(roomId);
        if (state) namespace.to(roomId).emit("room:state", state);
      }
    }
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
