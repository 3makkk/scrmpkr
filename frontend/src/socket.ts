import { io, type Socket } from 'socket.io-client';

let socket: Socket | undefined;
export type AuthPayload = { name: string; userId: string } | { token: string };
export function getSocket(auth: AuthPayload): Socket {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_API_URL}/poker`, { auth });
  }
  return socket;
}
