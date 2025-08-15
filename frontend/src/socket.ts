import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@scrmpkr/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;
export type AuthPayload = { name: string; userId: string };
export function getSocket(
  auth: AuthPayload,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL;

    const created = io(`${apiUrl}/poker`, {
      auth,
      path: import.meta.env.VITE_SOCKET_PATH,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;
    socket = created;
  }
  return socket;
}
