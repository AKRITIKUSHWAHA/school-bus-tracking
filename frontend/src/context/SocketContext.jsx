import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Backend ka URL .env file se uthayenge (Default: localhost:5000)
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Jab app band ho toh connection tod do
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);