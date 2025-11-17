import "dotenv/config";
import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { RoomManager, type User, type RoomState } from "./roomManager";
import logger from "./logger";

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
  "room:create": (
    data: { roomName: string },
    cb: (resp: { roomId: string } | { error: string }) => void,
  ) => void;
  "room:join": (
    data: { roomId: string },
    cb: (resp: { state: RoomState } | { error: string }) => void,
  ) => void;
  "room:leave": (
    data: { roomId: string },
    cb?: (resp: { success: boolean }) => void,
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

namespace.on("connection", (socket) => {
  const transport = socket.conn.transport.name; // in most cases, "polling"
  logger.info(`Socket connected using transport: ${transport}`);

  const { id: userId, name: userName } = socket.data.user;

  // Enforce single active connection per userId by disconnecting the previous one
  const existingSocketId = activeSockets.get(userId);
  if (existingSocketId && existingSocketId !== socket.id) {
    const existingSocket = namespace.sockets.get(existingSocketId);
    if (existingSocket) {
      existingSocket.emit("force:disconnect", {
        reason: "Another session connected with your account",
      });
      existingSocket.disconnect(true);
      logger.info(
        { userId, userName, kickedSocketId: existingSocketId },
        "Disconnected previous socket for user",
      );
    }
  }
  activeSockets.set(userId, socket.id);

  socket.conn.on("upgrade", () => {
    const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
    logger.info(`Socket upgraded to transport: ${upgradedTransport}`);
  });

  logger.info(
    {
      userId: socket.data.user.id,
      userName: socket.data.user.name,
      socketId: socket.id,
    },
    "User connected",
  );

  socket.on("room:create", ({ roomName }, cb) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
      },
      "Room creation was requested",
    );
    try {
      const room = rooms.createRoom(
        socket.data.user.id,
        socket.data.user.name,
        roomName,
      );
      socket.join(room.id);
      logger.info(
        { userId: socket.data.user.id, roomId: room.id },
        "User joined socket room",
      );
      cb({ roomId: room.id });
      const state = rooms.getState(room.id);
      if (state) namespace.to(room.id).emit("room:state", state);
    } catch (error) {
      const e = error as Error;
      logger.warn(
        {
          userId: socket.data.user.id,
          userName: socket.data.user.name,
          roomName,
          error: e.message,
        },
        "Room creation failed",
      );
      cb({ error: e.message });
    }
  });

  socket.on("room:join", ({ roomId }, cb) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
      },
      "Room join was requested",
    );
    try {
      const room = rooms.joinRoom(roomId, socket.data.user);
      socket.join(room.id);
      logger.info(
        { userId: socket.data.user.id, roomId: room.id },
        "User joined socket room",
      );
      const state = rooms.getState(room.id);
      if (state) {
        cb({ state });
        namespace.to(room.id).emit("room:state", state);
      } else {
        cb({ error: "Room not found" });
      }
    } catch (error) {
      const e = error as Error;
      logger.warn(
        { userId: socket.data.user.id, roomId, error: e.message },
        "Room join failed",
      );
      cb({ error: e.message });
    }
  });

  socket.on("room:leave", ({ roomId }, cb) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
      },
      "Room leave was requested",
    );
    const result = rooms.leaveRoom(roomId, socket.data.user.id);
    if (result !== false && result.wasInRoom) {
      const normalizedRoomId = roomId.trim().toLowerCase();
      socket.leave(normalizedRoomId);
      logger.info(
        { userId: socket.data.user.id, roomId: normalizedRoomId },
        "User left socket room",
      );
      // Notify other participants about the updated room state
      {
        const state = rooms.getState(roomId);
        if (state) namespace.to(state.id).emit("room:state", state);
      }
      if (cb) cb({ success: true });
    } else {
      logger.warn(
        { userId: socket.data.user.id, roomId },
        "Leave failed, user not in room",
      );
      if (cb) cb({ success: false });
    }
  });

  socket.on("vote:cast", ({ roomId, value }) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
        value,
      },
      "Vote was cast",
    );
    rooms.castVote(roomId, socket.data.user.id, value);
    const state = rooms.getState(roomId);
    if (state) namespace.to(state.id).emit("room:state", state);
  });

  socket.on("reveal:start", ({ roomId }) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
      },
      "Reveal was requested",
    );
    // Ensure user is owner of this specific room and there are votes to reveal
    if (!rooms.isOwner(roomId, socket.data.user.id)) {
      logger.warn(
        { userId: socket.data.user.id, roomId },
        "Reveal was denied, user not owner",
      );
      return;
    }
    if (!rooms.hasAnyVotes(roomId)) {
      logger.warn({ roomId }, "Reveal was denied, no votes");
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, namespace);
  });

  socket.on("vote:clear", ({ roomId }) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
      },
      "Clear votes was requested",
    );
    // Ensure user is owner of this specific room
    if (!rooms.isOwner(roomId, socket.data.user.id)) {
      logger.warn(
        { userId: socket.data.user.id, roomId },
        "Clear votes was denied, user not owner",
      );
      return;
    }
    rooms.clearVotes(roomId);
    // Notify clients that votes were cleared, and broadcast fresh state
    const normalizedRoomId = roomId.trim().toLowerCase();
    namespace.to(normalizedRoomId).emit("votes:cleared");
    {
      const state = rooms.getState(roomId);
      if (state) namespace.to(state.id).emit("room:state", state);
    }
  });

  socket.on("disconnect", () => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        socketId: socket.id,
      },
      "User disconnected",
    );
    // Clear active socket tracking if this was the registered one for the user
    if (activeSockets.get(socket.data.user.id) === socket.id) {
      activeSockets.delete(socket.data.user.id);
    }

    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll(socket.data.user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      logger.info({ roomId }, "Room state update was sent");
      const state = rooms.getState(roomId);
      if (state) namespace.to(roomId).emit("room:state", state);
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
