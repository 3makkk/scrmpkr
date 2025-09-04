import "dotenv/config";
import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import {
  RoomManager,
  type User,
  type RoomState,
  type VoteProgress,
  type RevealedVote,
} from "./roomManager";
import logger from "./logger";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "vote:progress": (progress: VoteProgress) => void;
  "reveal:complete": (payload: {
    revealedVotes: RevealedVote[];
    unanimousValue?: number;
  }) => void;
  "votes:cleared": () => void;
}

interface ClientToServerEvents {
  "room:create": (
    data: { name: string },
    cb: (resp: { roomId: string }) => void,
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

  socket.on("room:create", ({ name }, cb) => {
    logger.info(
      {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
      },
      "Room creation was requested",
    );
    const room = rooms.createRoom(socket.data.user.id, name);
    socket.join(room.id);
    logger.info(
      { userId: socket.data.user.id, roomId: room.id },
      "User joined socket room",
    );
    cb({ roomId: room.id });
    {
      const state = rooms.getState(room.id);
      if (state) namespace.to(room.id).emit("room:state", state);
    }
    {
      const progress = rooms.getProgress(room.id);
      if (progress)
        namespace.to(room.id).emit("vote:progress", progress as VoteProgress);
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
      const _room = rooms.joinRoom(roomId, socket.data.user);
      socket.join(roomId);
      logger.info(
        { userId: socket.data.user.id, roomId },
        "User joined socket room",
      );
      const state = rooms.getState(roomId);
      if (state) {
        cb({ state });
        namespace.to(roomId).emit("room:state", state);
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
    {
      const progress = rooms.getProgress(roomId);
      if (progress)
        namespace.to(roomId).emit("vote:progress", progress as VoteProgress);
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
      socket.leave(roomId);
      logger.info(
        { userId: socket.data.user.id, roomId },
        "User left socket room",
      );
      // Notify other participants about the updated room state
      {
        const state = rooms.getState(roomId);
        if (state) namespace.to(roomId).emit("room:state", state);
      }
      {
        const progress = rooms.getProgress(roomId);
        if (progress)
          namespace.to(roomId).emit("vote:progress", progress as VoteProgress);
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
    {
      const progress = rooms.getProgress(roomId);
      if (progress)
        namespace.to(roomId).emit("vote:progress", progress as VoteProgress);
    }
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
    // Notify clients that votes were cleared, and broadcast fresh state + progress
    namespace.to(roomId).emit("votes:cleared");
    {
      const state = rooms.getState(roomId);
      if (state) namespace.to(roomId).emit("room:state", state);
    }
    {
      const progress = rooms.getProgress(roomId);
      if (progress)
        namespace.to(roomId).emit("vote:progress", progress as VoteProgress);
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
    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll(socket.data.user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      logger.info({ roomId }, "Room state update was sent");
      const state = rooms.getState(roomId);
      if (state) namespace.to(roomId).emit("room:state", state);
      const progress = rooms.getProgress(roomId);
      if (progress)
        namespace.to(roomId).emit("vote:progress", progress as VoteProgress);
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
