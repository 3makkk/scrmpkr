require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { verifyToken } = require('./tokenVerify');
const { RoomManager } = require('./roomManager');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'] }
});

const rooms = new RoomManager();

const namespace = io.of('/poker');
namespace.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('No token');
    const payload = await verifyToken(token);
    socket.user = { id: payload.sub, name: payload.name };
    next();
  } catch (err) {
    next(err);
  }
});

namespace.on('connection', socket => {
  socket.on('room:create', ({ name }, cb) => {
    const room = rooms.createRoom(socket.user.id, name);
    socket.join(room.id);
    cb({ roomId: room.id });
    namespace.to(room.id).emit('room:state', rooms.getState(room.id));
  });

  socket.on('room:join', ({ roomId }, cb) => {
    const room = rooms.joinRoom(roomId, socket.user);
    socket.join(roomId);
    cb({ state: rooms.getState(roomId) });
    namespace.to(roomId).emit('room:state', rooms.getState(roomId));
  });

  socket.on('vote:cast', ({ roomId, value }) => {
    rooms.castVote(roomId, socket.user.id, value);
    namespace.to(roomId).emit('vote:progress', rooms.getProgress(roomId));
  });

  socket.on('reveal:start', ({ roomId }) => {
    if (!rooms.isOwner(roomId, socket.user.id)) return;
    rooms.startReveal(roomId, namespace);
  });

  socket.on('vote:clear', ({ roomId }) => {
    if (!rooms.isOwner(roomId, socket.user.id)) return;
    rooms.clearVotes(roomId);
    namespace.to(roomId).emit('votes:cleared');
    namespace.to(roomId).emit('room:state', rooms.getState(roomId));
  });

  socket.on('disconnect', () => {
    rooms.leaveAll(socket.user.id);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`server listening on ${port}`));
