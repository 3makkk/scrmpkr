import "dotenv/config";
import "./metrics.js";
import http from "node:http";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@scrmpkr/shared";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import logger from "./logger.js";
import { setMetricCallbacks } from "./metrics.js";
import { RoomManager } from "./roomManager.js";
import {
  type InterServerEvents,
  registerPokerHandlers,
  type SocketData,
} from "./socketHandlers.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

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

registerPokerHandlers(namespace, rooms);

const port = process.env.PORT || 4000;
server.listen(port, () => logger.info({ port }, "Server started listening"));
