import { io } from 'socket.io-client';

let socket;
export function getSocket(token) {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_API_URL}/poker`, { auth: { token } });
  }
  return socket;
}
