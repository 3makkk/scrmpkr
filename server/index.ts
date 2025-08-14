import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { verifyToken } from "./tokenVerify";
import { RoomManager, type User } from "./roomManager";
import logger from "./logger";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

type AuthenticatedSocket = import("socket.io").Socket & { user: User };
type AuthPayload = { token?: string; name?: string; userId?: string };

const namespace: import("socket.io").Namespace = io.of("/poker");
namespace.use(async (socket, next) => {
  try {
    const { token, name, userId } = (socket.handshake.auth || {}) as AuthPayload;
    if (token) {
      const payload = await verifyToken(token);
      (socket as AuthenticatedSocket).user = {
        id: String(payload.sub),
        name: payload.name ?? "",
      };
      logger.info(
        { userId: payload.sub, userName: payload.name },
        "User authenticated with token"
      );
    } else if (name && userId) {
      (socket as AuthenticatedSocket).user = { id: String(userId), name: String(name) };
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

namespace.on("connection", (socket: import("socket.io").Socket) => {
  const s = socket as AuthenticatedSocket;
  logger.info(
    {
      userId: s.user.id,
      userName: s.user.name,
      socketId: socket.id,
    },
    "User connected"
  );

  socket.on(
    "room:create",
    ({ name }: { name: string }, cb: (resp: { roomId: string }) => void) => {
      logger.info(
        {
          userId: s.user.id,
          userName: s.user.name,
          name,
        },
        "Room creation was requested"
      );
      const room = rooms.createRoom(s.user.id, name);
      socket.join(room.id);
      logger.info(
        { userId: s.user.id, roomId: room.id },
        "User joined socket room"
      );
      cb({ roomId: room.id });
      namespace.to(room.id).emit("room:state", rooms.getState(room.id));
    }
  );

  socket.on(
    "room:join",
    (
      { roomId }: { roomId: string },
      cb: (
        resp:
          | { state: NonNullable<ReturnType<typeof rooms.getState>> }
          | { error: string }
      ) => void
    ) => {
      logger.info(
        {
          userId: s.user.id,
          userName: s.user.name,
          roomId,
        },
        "Room join was requested"
      );
      try {
        const room = rooms.joinRoom(roomId, s.user);
        socket.join(roomId);
        logger.info(
          { userId: s.user.id, roomId },
          "User joined socket room"
        );
        const state = rooms.getState(roomId);
        // state is non-null after successful join
        cb({ state: state as NonNullable<typeof state> });
        namespace.to(roomId).emit("room:state", rooms.getState(roomId));
      } catch (error) {
        const e = error as Error;
        logger.warn(
          { userId: s.user.id, roomId, error: e.message },
          "Room join failed"
        );
        cb({ error: e.message });
      }
    }
  );

  socket.on(
    "room:leave",
    (
      { roomId }: { roomId: string },
      cb?: (resp: { success: boolean }) => void
    ) => {
      logger.info(
        {
          userId: s.user.id,
          userName: s.user.name,
          roomId,
        },
        "Room leave was requested"
      );
      const result = rooms.leaveRoom(roomId, s.user.id);
      if (result && result.wasInRoom) {
        socket.leave(roomId);
        logger.info(
          { userId: s.user.id, roomId },
          "User left socket room"
        );
        // Notify other participants about the updated room state
        namespace.to(roomId).emit("room:state", rooms.getState(roomId));
        if (cb) cb({ success: true });
      } else {
        logger.warn(
          { userId: s.user.id, roomId },
          "Leave failed, user not in room"
        );
        if (cb) cb({ success: false });
      }
    }
  );

  socket.on(
    "vote:cast",
    ({ roomId, value }: { roomId: string; value: number | "?" }) => {
      logger.info(
        {
          userId: s.user.id,
          userName: s.user.name,
          roomId,
          value,
        },
        "Vote was cast"
      );
      rooms.castVote(roomId, s.user.id, value);
      namespace.to(roomId).emit("vote:progress", rooms.getProgress(roomId));
    }
  );

  socket.on("reveal:start", ({ roomId }: { roomId: string }) => {
    logger.info(
      {
        userId: s.user.id,
        userName: s.user.name,
        roomId,
      },
      "Reveal was requested"
    );
    // Ensure user is owner of this specific room and there are votes to reveal
    if (!rooms.isOwner(roomId, s.user.id)) {
      logger.warn(
        { userId: s.user.id, roomId },
        "Reveal was denied, user not owner"
      );
      return;
    }
    if (!rooms.hasAnyVotes(roomId)) {
      logger.warn({ roomId }, "Reveal was denied, no votes");
      return; // Don't allow reveal if no votes
    }
    rooms.startReveal(roomId, namespace);
  });

  socket.on("vote:clear", ({ roomId }: { roomId: string }) => {
    logger.info(
      {
        userId: s.user.id,
        userName: s.user.name,
        roomId,
      },
      "Clear votes was requested"
    );
    // Ensure user is owner of this specific room
    if (!rooms.isOwner(roomId, s.user.id)) {
      logger.warn(
        { userId: s.user.id, roomId },
        "Clear votes was denied, user not owner"
      );
      return;
    }
    rooms.clearVotes(roomId);
    namespace.to(roomId).emit("votes:cleared");
    namespace.to(roomId).emit("room:state", rooms.getState(roomId));
  });

  socket.on("disconnect", () => {
    logger.info(
      {
        userId: s.user.id,
        userName: s.user.name,
        socketId: socket.id,
      },
      "User disconnected"
    );
    // Remove user from all rooms and update affected rooms
    const updatedRoomIds = rooms.leaveAll(s.user.id);
    // Emit updated state to all affected rooms
    updatedRoomIds.forEach((roomId) => {
      logger.info({ roomId }, "Room state update was sent");
      namespace.to(roomId).emit("room:state", rooms.getState(roomId));
    });
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
