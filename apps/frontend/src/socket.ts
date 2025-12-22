import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@scrmpkr/shared";

type CheckRoomExistsCallback = (exists: boolean) => void;

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

export type AuthPayload = { name: string; userId: string };

export function getSocket(
  auth: AuthPayload,
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

export function getCurrentSocket():
  | Socket<ServerToClientEvents, ClientToServerEvents>
  | undefined {
  return socket;
}

export function checkRoomExists(
  auth: AuthPayload,
  roomId: string,
  callback: CheckRoomExistsCallback,
): void {
  const sock = getSocket(auth);
  sock.emit("room:exists", { roomId }, ({ exists }) => {
    callback(exists);
  });
}
