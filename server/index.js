require("dotenv").config();
const express = require("express");
const http = require("node:http");
const cors = require("cors");
const { Server } = require("socket.io");
const { verifyToken } = require("./tokenVerify");
const { RoomManager } = require("./roomManager");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

const namespace = io.of("/poker");
namespace.use(async (socket, next) => {
  try {
    const { token, name, userId } = socket.handshake.auth || {};
    if (token) {
      const payload = await verifyToken(token);
      socket.user = { id: payload.sub, name: payload.name };
      console.log(
        `🔐 User authenticated via token: ${payload.sub} (${payload.name})`,
      );
    } else if (name && userId) {
      socket.user = { id: userId, name };
      console.log(`👤 User authenticated via credentials: ${userId} (${name})`);
    } else {
      console.log(`❌ Authentication failed: No valid credentials provided`);
      throw new Error("No auth");
    }
    next();
  } catch (err) {
    console.log(`❌ Authentication error:`, err.message);
    next(err);
  }
});

namespace.on("connection", (socket) => {
  console.log(
    `🔌 User connected: ${socket.user.id} (${socket.user.name}) - Socket: ${socket.id}`,
  );

  socket.on("room:create", ({ name }, cb) => {
    console.log(
      `🏗️  Room creation requested by ${socket.user.id} (${socket.user.name}) with name: "${name}"`,
    );
    const room = rooms.createRoom(socket.user.id, name);
    socket.join(room.id);
    console.log(`✅ User ${socket.user.id} joined socket room: ${room.id}`);
    cb({ roomId: room.id });
    namespace.to(room.id).emit("room:state", rooms.getState(room.id));
  });

  socket.on("room:join", ({ roomId }, cb) => {
    console.log(
      `🚪 Room join requested: ${socket.user.id} (${socket.user.name}) -> room ${roomId}`,
    );
    try {
      rooms.joinRoom(roomId, socket.user);
      socket.join(roomId);
      console.log(`✅ User ${socket.user.id} joined socket room: ${roomId}`);
      cb({ state: rooms.getState(roomId) });
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    } catch (error) {
      console.log(`❌ Room join failed: ${error.message}`);
      cb({ error: error.message });
    }
  });

  socket.on("room:leave", ({ roomId }, cb) => {
    console.log(
      `🚪 Room leave requested: ${socket.user.id} (${socket.user.name}) -> room ${roomId}`,
    );
    const result = rooms.leaveRoom(roomId, socket.user.id);
    if (result?.wasInRoom) {
      socket.leave(roomId);
      console.log(`✅ User ${socket.user.id} left socket room: ${roomId}`);
      // Notify other participants about the updated room state
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
      if (cb) cb({ success: true });
    } else {
      console.log(`❌ Leave failed: User was not in room ${roomId}`);
      if (cb) cb({ success: false });
    }
  });

  socket.on("vote:cast", ({ roomId, value }) => {
    console.log(
      `🗳️  Vote cast: ${socket.user.id} (${socket.user.name}) -> room ${roomId}, value: ${value}`,
    );
    rooms.castVote(roomId, socket.user.id, value);
    namespace.to(roomId).emit("vote:progress", rooms.getProgress(roomId));
  });

  socket.on("reveal:start", ({ roomId }) => {
    console.log(
      `🎭 Reveal requested: ${socket.user.id} (${socket.user.name}) -> room ${roomId}`,
    );
    // Ensure user is owner of this specific room and there are votes to reveal
    if (!rooms.isOwner(roomId, socket.user.id)) {
      console.log(
        `🚫 Reveal denied: User ${socket.user.id} is not owner of room ${roomId}`,
      );
      return;
    }
    if (!rooms.hasAnyVotes(roomId)) {
      console.log(`🚫 Reveal denied: No votes in room ${roomId}`);
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, namespace);
  });

  socket.on("vote:clear", ({ roomId }) => {
    console.log(
      `🧹 Clear votes requested: ${socket.user.id} (${socket.user.name}) -> room ${roomId}`,
    );
    // Ensure user is owner of this specific room
    if (!rooms.isOwner(roomId, socket.user.id)) {
      console.log(
        `🚫 Clear denied: User ${socket.user.id} is not owner of room ${roomId}`,
      );
      return;
    }
    rooms.clearVotes(roomId);
    namespace.to(roomId).emit("votes:cleared");
    namespace.to(roomId).emit("room:state", rooms.getState(roomId));
  });

  socket.on("disconnect", () => {
    console.log(
      `🔌 User disconnected: ${socket.user.id} (${socket.user.name}) - Socket: ${socket.id}`,
    );
    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll(socket.user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      console.log(`📡 Sending room state update to room ${roomId}`);
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
