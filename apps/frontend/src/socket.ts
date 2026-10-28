import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@scrmpkr/shared";
import { io, type Socket } from "socket.io-client";

type CheckRoomExistsCallback = (exists: boolean | null) => void;

const ROOM_EXISTS_TIMEOUT_MS = 5000;

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
  } else {
    // The handshake auth is captured when the socket is created and re-sent on
    // every reconnect, so keep it in sync with the current account. A different
    // user needs a fresh handshake.
    const previous = socket.auth as Partial<AuthPayload>;
    socket.auth = auth;
    if (previous.userId !== auth.userId && socket.connected) {
      socket.disconnect();
    }
    if (socket.disconnected) socket.connect();
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
  // Without a timeout the callback never fires while the server is
  // unreachable; report null so the caller can show an error instead.
  sock
    .timeout(ROOM_EXISTS_TIMEOUT_MS)
    .emit("room:exists", { roomId }, (err, response) => {
      callback(err ? null : response.exists);
    });
}
