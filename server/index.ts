import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { verifyToken } from "./tokenVerify";
import { RoomManager } from "./roomManager";
import logger from "./logger";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

const namespace = io.of("/poker");
namespace.use(async (socket, next) => {
  try {
    const { token, name, userId } = (socket.handshake.auth || {}) as any;
    if (token) {
      const payload: any = await verifyToken(token);
      (socket as any).user = { id: payload.sub, name: payload.name };
      logger.info({ userId: payload.sub, userName: payload.name }, "User authenticated with token");
    } else if (name && userId) {
      (socket as any).user = { id: userId as string, name: name as string };
      logger.info({ userId, userName: name }, "User authenticated with credentials");
    } else {
      logger.warn("Authentication failed, no credentials provided");
      throw new Error("No auth");
    }
    next();
  } catch (err) {
    const e = err as Error;
    logger.error({ error: e.message }, "Authentication error occurred");
    next(e as any);
  }
});

namespace.on("connection", (socket) => {
  logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, socketId: socket.id }, "User connected");

  socket.on("room:create", ({ name }: { name: string }, cb: (resp: { roomId: string }) => void) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, name }, "Room creation was requested");
    const room = rooms.createRoom((socket as any).user.id, name);
    socket.join(room.id);
    logger.info({ userId: (socket as any).user.id, roomId: room.id }, "User joined socket room");
    cb({ roomId: room.id });
    namespace.to(room.id).emit("room:state", rooms.getState(room.id));
  });

  socket.on("room:join", ({ roomId }: { roomId: string }, cb: (resp: any) => void) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, roomId }, "Room join was requested");
    try {
      const room = rooms.joinRoom(roomId, (socket as any).user);
      socket.join(roomId);
      logger.info({ userId: (socket as any).user.id, roomId }, "User joined socket room");
      cb({ state: rooms.getState(roomId) });
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    } catch (error) {
      const e = error as Error;
      logger.warn({ userId: (socket as any).user.id, roomId, error: e.message }, "Room join failed");
      cb({ error: e.message });
    }
  });

  socket.on("room:leave", ({ roomId }: { roomId: string }, cb?: (resp: { success: boolean }) => void) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, roomId }, "Room leave was requested");
    const result = rooms.leaveRoom(roomId, (socket as any).user.id);
    if (result && result.wasInRoom) {
      socket.leave(roomId);
      logger.info({ userId: (socket as any).user.id, roomId }, "User left socket room");
      // Notify other participants about the updated room state
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
      if (cb) cb({ success: true });
    } else {
      logger.warn({ userId: (socket as any).user.id, roomId }, "Leave failed, user not in room");
      if (cb) cb({ success: false });
    }
  });

  socket.on("vote:cast", ({ roomId, value }: { roomId: string; value: number | "?" }) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, roomId, value }, "Vote was cast");
    rooms.castVote(roomId, (socket as any).user.id, value);
    namespace.to(roomId).emit("vote:progress", rooms.getProgress(roomId));
  });

  socket.on("reveal:start", ({ roomId }: { roomId: string }) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, roomId }, "Reveal was requested");
    // Ensure user is owner of this specific room and there are votes to reveal
    if (!rooms.isOwner(roomId, (socket as any).user.id)) {
      logger.warn({ userId: (socket as any).user.id, roomId }, "Reveal was denied, user not owner");
      return;
    }
    if (!rooms.hasAnyVotes(roomId)) {
      logger.warn({ roomId }, "Reveal was denied, no votes");
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, namespace);
  });

  socket.on("vote:clear", ({ roomId }: { roomId: string }) => {
    logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, roomId }, "Clear votes was requested");
    // Ensure user is owner of this specific room
    if (!rooms.isOwner(roomId, (socket as any).user.id)) {
      logger.warn({ userId: (socket as any).user.id, roomId }, "Clear votes was denied, user not owner");
      return;
    }
    rooms.clearVotes(roomId);
    namespace.to(roomId).emit("votes:cleared");
    namespace.to(roomId).emit("room:state", rooms.getState(roomId));
  });

  socket.on("disconnect", () => {
  logger.info({ userId: (socket as any).user.id, userName: (socket as any).user.name, socketId: socket.id }, "User disconnected");
    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll((socket as any).user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      logger.info({ roomId }, "Room state update was sent");
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
