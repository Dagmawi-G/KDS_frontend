import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // In dev, Vite proxies /socket.io to :3001 automatically
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket gateway:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket gateway:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', room);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
