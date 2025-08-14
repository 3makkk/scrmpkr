import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { verifyToken } from "./tokenVerify";
import { RoomManager } from "./roomManager";

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
      console.log(
        `🔐 User authenticated via token: ${payload.sub} (${payload.name})`
      );
    } else if (name && userId) {
      (socket as any).user = { id: userId as string, name: name as string };
      console.log(`👤 User authenticated via credentials: ${userId} (${name})`);
    } else {
      console.log(`❌ Authentication failed: No valid credentials provided`);
      throw new Error("No auth");
    }
    next();
  } catch (err) {
    const e = err as Error;
    console.log(`❌ Authentication error:`, e.message);
    next(e as any);
  }
});

namespace.on("connection", (socket) => {
  console.log(
    `🔌 User connected: ${(socket as any).user.id} (${(socket as any).user.name}) - Socket: ${socket.id}`
  );

  socket.on("room:create", ({ name }: { name: string }, cb: (resp: { roomId: string }) => void) => {
    console.log(
      `🏗️  Room creation requested by ${(socket as any).user.id} (${(socket as any).user.name}) with name: "${name}"`
    );
    const room = rooms.createRoom((socket as any).user.id, name);
    socket.join(room.id);
    console.log(`✅ User ${(socket as any).user.id} joined socket room: ${room.id}`);
    cb({ roomId: room.id });
    namespace.to(room.id).emit("room:state", rooms.getState(room.id));
  });

  socket.on("room:join", ({ roomId }: { roomId: string }, cb: (resp: any) => void) => {
    console.log(
      `🚪 Room join requested: ${(socket as any).user.id} (${(socket as any).user.name}) -> room ${roomId}`
    );
    try {
      const room = rooms.joinRoom(roomId, (socket as any).user);
      socket.join(roomId);
      console.log(`✅ User ${(socket as any).user.id} joined socket room: ${roomId}`);
      cb({ state: rooms.getState(roomId) });
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    } catch (error) {
      const e = error as Error;
      console.log(`❌ Room join failed: ${e.message}`);
      cb({ error: e.message });
    }
  });

  socket.on("room:leave", ({ roomId }: { roomId: string }, cb?: (resp: { success: boolean }) => void) => {
    console.log(
      `🚪 Room leave requested: ${(socket as any).user.id} (${(socket as any).user.name}) -> room ${roomId}`
    );
    const result = rooms.leaveRoom(roomId, (socket as any).user.id);
    if (result && result.wasInRoom) {
      socket.leave(roomId);
      console.log(`✅ User ${(socket as any).user.id} left socket room: ${roomId}`);
      // Notify other participants about the updated room state
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
      if (cb) cb({ success: true });
    } else {
      console.log(`❌ Leave failed: User was not in room ${roomId}`);
      if (cb) cb({ success: false });
    }
  });

  socket.on("vote:cast", ({ roomId, value }: { roomId: string; value: number | "?" }) => {
    console.log(
      `🗳️  Vote cast: ${(socket as any).user.id} (${(socket as any).user.name}) -> room ${roomId}, value: ${value}`
    );
    rooms.castVote(roomId, (socket as any).user.id, value);
    namespace.to(roomId).emit("vote:progress", rooms.getProgress(roomId));
  });

  socket.on("reveal:start", ({ roomId }: { roomId: string }) => {
    console.log(
      `🎭 Reveal requested: ${(socket as any).user.id} (${(socket as any).user.name}) -> room ${roomId}`
    );
    // Ensure user is owner of this specific room and there are votes to reveal
    if (!rooms.isOwner(roomId, (socket as any).user.id)) {
      console.log(
        `🚫 Reveal denied: User ${(socket as any).user.id} is not owner of room ${roomId}`
      );
      return;
    }
    if (!rooms.hasAnyVotes(roomId)) {
      console.log(`🚫 Reveal denied: No votes in room ${roomId}`);
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, namespace);
  });

  socket.on("vote:clear", ({ roomId }: { roomId: string }) => {
    console.log(
      `🧹 Clear votes requested: ${(socket as any).user.id} (${(socket as any).user.name}) -> room ${roomId}`
    );
    // Ensure user is owner of this specific room
    if (!rooms.isOwner(roomId, (socket as any).user.id)) {
      console.log(
        `🚫 Clear denied: User ${(socket as any).user.id} is not owner of room ${roomId}`
      );
      return;
    }
    rooms.clearVotes(roomId);
    namespace.to(roomId).emit("votes:cleared");
    namespace.to(roomId).emit("room:state", rooms.getState(roomId));
  });

  socket.on("disconnect", () => {
    console.log(
      `🔌 User disconnected: ${(socket as any).user.id} (${(socket as any).user.name}) - Socket: ${socket.id}`
    );
    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll((socket as any).user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      console.log(`📡 Sending room state update to room ${roomId}`);
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
