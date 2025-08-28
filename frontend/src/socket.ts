import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@scrmpkr/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

export type AuthPayload = { name: string; userId: string };

export function getSocket(
  auth: AuthPayload
): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const path = import.meta.env.VITE_SOCKET_PATH;

    socket = io(`${apiUrl}/poker`, {
      auth,
      path,
      autoConnect: true,
      reconnection: true,
      withCredentials: !!import.meta.env.PROD,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    window.addEventListener("beforeunload", () => {
      socket?.disconnect();
    });
  } else if (socket.disconnected) {
    socket.connect();
  }

  return socket;
}
