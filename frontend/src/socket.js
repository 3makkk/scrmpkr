import { io } from "socket.io-client";

let socket;
export function getSocket(auth) {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_API_URL}/poker`, { auth });
  }
  return socket;
}
