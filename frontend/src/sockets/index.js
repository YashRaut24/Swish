import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../utils/constants';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
    transports: ['websocket'],
    withCredentials: true,
    auth: { token },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
