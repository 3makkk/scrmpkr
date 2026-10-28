import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@scrmpkr/shared";
import { io, type Socket } from "socket.io-client";

type CheckRoomExistsCallback = (exists: boolean | null) => void;

const ROOM_EXISTS_TIMEOUT_MS = 5000;

export type PokerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: PokerSocket | undefined;

export type AuthPayload = { name: string; userId: string };

// Read on every (re)connect handshake, so the server always gets the current
// account, including a name changed after the socket was created.
let currentAuth: AuthPayload | undefined;

export function setSocketAuthName(name: string): void {
  if (currentAuth) currentAuth = { ...currentAuth, name };
}

export function getSocket(auth: AuthPayload): PokerSocket {
  const userChanged = currentAuth?.userId !== auth.userId;
  currentAuth = auth;

  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const path = import.meta.env.VITE_SOCKET_PATH;

    socket = io(`${apiUrl}/poker`, {
      auth: (cb) => cb(currentAuth ?? {}),
      path,
      autoConnect: true,
      reconnection: true,
      withCredentials: !!import.meta.env.PROD,
    }) as PokerSocket;

    window.addEventListener("beforeunload", () => {
      socket?.disconnect();
    });
  } else {
    // A different user needs a fresh handshake.
    if (userChanged && socket.connected) socket.disconnect();
    if (socket.disconnected) socket.connect();
  }

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
