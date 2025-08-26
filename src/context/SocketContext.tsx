import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import {
  SocketService,
  createSocketService,
  getSocketService,
  defaultSocketConfig,
  type ConnectionStatus,
} from "../services/socketService";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: number;
  room?: string;
}

interface User {
  id: string;
  name: string;
  status: "online" | "offline" | "away";
  lastSeen?: number;
}

interface SocketContextType {
  socketService: SocketService | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  messages: Message[];
  users: User[];
  currentRoom: string | null;
  currentUser: User | null;
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  sendMessage: (content: string, room?: string) => void;
  joinRoom: (room: string) => Promise<void>;
  leaveRoom: (room: string) => Promise<void>;
  clearMessages: () => void;
  updateUserStatus: (status: User["status"]) => void;
  setCurrentUser: (user: User) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);
export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socketService, setSocketService] = useState<SocketService | null>(
    null
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    lastDisconnected: null,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Update connection status from socket service
  const updateConnectionStatus = useCallback(() => {
    if (socketService) {
      const status = socketService.getStatus();
      setConnectionStatus(status);
    }
  }, [socketService]);

  // Set up socket event listeners
  const setupEventListeners = useCallback(
    (service: SocketService) => {
      // Connection status updates
      const statusUpdateInterval = setInterval(() => {
        updateConnectionStatus();
      }, 1000);

      // Message events
      service.on<Message>("message", (message) => {
        setMessages((prev) => {
          const newMessages = [
            ...prev,
            { ...message, id: Date.now().toString() },
          ];
          return newMessages.slice(-100); // Keep last 100 messages
        });
      });

      // User events
      service.on<User>("user-joined", (user) => {
        setUsers((prev) => {
          const filtered = prev.filter((u) => u.id !== user.id);
          return [...filtered, user];
        });
      });

      service.on<{ userId: string }>("user-left", (data) => {
        setUsers((prev) => prev.filter((u) => u.id !== data.userId));
      });

      service.on<User>("user-status-changed", (user) => {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
        // Update current user if it's the same user
        if (currentUser && user.id === currentUser.id) {
          setCurrentUser(user);
        }
      });

      // Room events
      service.on<{ room: string; users: User[] }>("room-joined", (data) => {
        setCurrentRoom(data.room);
        setUsers(data.users || []);
        setMessages([]); // Clear messages when joining new room
      });

      service.on<{ room: string }>("room-left", (data) => {
        if (currentRoom === data.room) {
          setCurrentRoom(null);
          setMessages([]);
          setUsers([]);
        }
      });

      // Presence events
      service.on<User[]>("users-list", (usersList) => {
        setUsers(usersList);
      });

      // Error events
      service.on<{ message: string }>("error", (error) => {
        console.error("Socket error:", error.message);
      });

      // Cleanup function
      return () => {
        clearInterval(statusUpdateInterval);
        service.off("message");
        service.off("user-joined");
        service.off("user-left");
        service.off("user-status-changed");
        service.off("room-joined");
        service.off("room-left");
        service.off("users-list");
        service.off("error");
      };
    },
    [updateConnectionStatus, currentUser, currentRoom]
  );

  const connect = useCallback(
    async (url?: string) => {
      if (connectionStatus.isConnected || connectionStatus.isConnecting) return;

      try {
        // Create or get existing socket service
        let service = getSocketService();
        if (!service || (url && service !== socketService)) {
          const config = {
            ...defaultSocketConfig,
            url: url || defaultSocketConfig.url,
          };
          service = createSocketService(config);
          setSocketService(service);
        }

        // Set up event listeners before connecting
        setupEventListeners(service);

        // Connect
        await service.connect();
        updateConnectionStatus();
      } catch (err) {
        console.error("Connection failed:", err);
        updateConnectionStatus();
      }
    },
    [
      connectionStatus.isConnected,
      connectionStatus.isConnecting,
      socketService,
      updateConnectionStatus,
      setupEventListeners,
    ]
  );

  const disconnect = useCallback(() => {
    if (socketService) {
      socketService.disconnect();
      setCurrentRoom(null);
      setMessages([]);
      setUsers([]);
      updateConnectionStatus();
    }
  }, [socketService, updateConnectionStatus]);

  const reconnect = useCallback(async () => {
    if (socketService) {
      try {
        await socketService.reconnect();
        updateConnectionStatus();
      } catch (err) {
        console.error("Reconnection failed:", err);
        updateConnectionStatus();
      }
    }
  }, [socketService, updateConnectionStatus]);

  const sendMessage = useCallback(
    (content: string, room?: string) => {
      if (!socketService || !connectionStatus.isConnected || !currentUser)
        return;

      const message: Omit<Message, "id"> = {
        user: currentUser.name,
        content,
        timestamp: Date.now(),
        room: room || currentRoom || undefined,
      };

      socketService.emit("send-message", message);
    },
    [socketService, connectionStatus.isConnected, currentUser, currentRoom]
  );

  const joinRoom = useCallback(
    async (room: string) => {
      if (!socketService || !connectionStatus.isConnected) {
        throw new Error("Socket not connected");
      }
      try {
        await socketService.joinRoom(room);
        setCurrentRoom(room);
        setMessages([]); // Clear messages when joining new room
      } catch (err) {
        console.error("Failed to join room:", err);
        throw err;
      }
    },
    [socketService, connectionStatus.isConnected]
  );

  const leaveRoom = useCallback(
    async (room: string) => {
      if (!socketService || !connectionStatus.isConnected) {
        throw new Error("Socket not connected");
      }
      try {
        await socketService.leaveRoom(room);
        if (currentRoom === room) {
          setCurrentRoom(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to leave room:", err);
        throw err;
      }
    },
    [socketService, connectionStatus.isConnected, currentRoom]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateUserStatus = useCallback(
    (status: User["status"]) => {
      if (!socketService || !connectionStatus.isConnected || !currentUser)
        return;

      const updatedUser = { ...currentUser, status };
      setCurrentUser(updatedUser);
      socketService.emit("update-status", { userId: currentUser.id, status });
    },
    [socketService, connectionStatus.isConnected, currentUser]
  );

  const setCurrentUserCallback = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketService) {
        socketService.destroy();
      }
    };
  }, [socketService]);

  // Update connection status periodically
  useEffect(() => {
    if (socketService) {
      const interval = setInterval(updateConnectionStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [socketService, updateConnectionStatus]);

  const value: SocketContextType = {
    socketService,
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    isReconnecting: connectionStatus.isReconnecting,
    error: connectionStatus.error,
    connectionStatus,
    messages,
    users,
    currentRoom,
    currentUser,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    clearMessages,
    updateUserStatus,
    setCurrentUser: setCurrentUserCallback,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
