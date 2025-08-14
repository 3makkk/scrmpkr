import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@scrmpkr/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;
export type AuthPayload = { name: string; userId: string } | { token: string };
export function getSocket(
  auth: AuthPayload,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const created = io(`${import.meta.env.VITE_API_URL}/poker`, {
      auth,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;
    socket = created;
  }
  return socket;
}
