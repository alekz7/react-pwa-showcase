import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import type {
  SocketState,
  SocketAction,
  SocketUser,
  SocketMessage,
} from "./types";
import { createMockSocket, type MockSocket } from "./constants";

// Initial state
const initialState: SocketState = {
  connected: false,
  connecting: false,
  error: null,
  users: [],
  messages: [],
  rooms: [],
  currentRoom: null,
};

// Reducer function
const socketReducer = (
  state: SocketState,
  action: SocketAction
): SocketState => {
  switch (action.type) {
    case "SET_CONNECTED":
      return {
        ...state,
        connected: action.payload,
        connecting: false,
        error: action.payload ? null : state.error,
      };

    case "SET_CONNECTING":
      return {
        ...state,
        connecting: action.payload,
        error: action.payload ? null : state.error,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        connecting: false,
        connected: false,
      };

    case "ADD_USER":
      return {
        ...state,
        users: [
          ...state.users.filter((u) => u.id !== action.payload.id),
          action.payload,
        ],
      };

    case "REMOVE_USER":
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.payload),
      };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.updates }
            : user
        ),
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload].slice(-100), // Keep last 100 messages
      };

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
      };

    case "JOIN_ROOM":
      return {
        ...state,
        currentRoom: action.payload,
        messages: [], // Clear messages when joining new room
      };

    case "LEAVE_ROOM":
      return {
        ...state,
        currentRoom: null,
        messages: [],
      };

    case "SET_ROOMS":
      return {
        ...state,
        rooms: action.payload,
      };

    default:
      return state;
  }
};

// Mock socket is now imported from constants

// Context interface
interface SocketContextType {
  state: SocketState;
  dispatch: React.Dispatch<SocketAction>;
  // Connection methods
  connect: () => void;
  disconnect: () => void;
  // Room methods
  joinRoom: (room: string) => void;
  leaveRoom: () => void;
  // Message methods
  sendMessage: (
    message: string,
    type?: SocketMessage["type"],
    data?: unknown
  ) => void;
  clearMessages: () => void;
  // User methods
  updateUserStatus: (status: SocketUser["status"]) => void;
  // Utility methods
  isConnected: () => boolean;
  getCurrentRoom: () => string | null;
  getUsers: () => SocketUser[];
  getMessages: () => SocketMessage[];
}

// Create context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Provider component
interface SocketProviderProps {
  children: React.ReactNode;
  socketUrl?: string; // For future real Socket.IO integration
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  socketUrl = "ws://localhost:3001",
}) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const socketRef = useRef<MockSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket
  useEffect(() => {
    // For now, use mock socket. In production, this would be:
    // socketRef.current = io(socketUrl);
    socketRef.current = createMockSocket();

    const socket = socketRef.current;

    // Set up event listeners
    socket.on("connect", () => {
      dispatch({ type: "SET_CONNECTED", payload: true });
      reconnectAttemptsRef.current = 0;

      // Simulate getting initial data
      setTimeout(() => {
        dispatch({ type: "SET_ROOMS", payload: ["general", "tech", "random"] });

        // Add some demo users
        const demoUsers: SocketUser[] = [
          {
            id: "user-1",
            name: "Alice Johnson",
            status: "online",
            lastSeen: Date.now(),
          },
          {
            id: "user-2",
            name: "Bob Smith",
            status: "away",
            lastSeen: Date.now() - 300000, // 5 minutes ago
          },
        ];

        demoUsers.forEach((user) => {
          dispatch({ type: "ADD_USER", payload: user });
        });
      }, 1000);
    });

    socket.on("disconnect", () => {
      dispatch({ type: "SET_CONNECTED", payload: false });

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          dispatch({ type: "SET_CONNECTING", payload: true });
          socket.connect();
        }, delay);
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to reconnect after multiple attempts",
        });
      }
    });

    socket.on("error", (error) => {
      const err = error as Error;
      dispatch({
        type: "SET_ERROR",
        payload: err.message || "Connection error",
      });
    });

    socket.on("user-joined", (user) => {
      const usr = user as SocketUser;
      dispatch({ type: "ADD_USER", payload: usr });
    });

    socket.on("user-left", (userId) => {
      const usrId = userId as string;
      dispatch({ type: "REMOVE_USER", payload: usrId });
    });

    socket.on("user-updated", (data) => {
      const dt = data as { id: string; updates: Partial<SocketUser> };
      dispatch({ type: "UPDATE_USER", payload: dt });
    });

    socket.on("message", (message) => {
      const msg = message as SocketMessage;
      dispatch({ type: "ADD_MESSAGE", payload: msg });
    });

    socket.on("room-joined", (data) => {
      const dt = data as { room: string };
      dispatch({ type: "JOIN_ROOM", payload: dt.room });
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [socketUrl]);

  // Connection methods
  const connect = () => {
    if (socketRef.current && !state.connected && !state.connecting) {
      dispatch({ type: "SET_CONNECTING", payload: true });
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socketRef.current.disconnect();
      dispatch({ type: "SET_CONNECTED", payload: false });
    }
  };

  // Room methods
  const joinRoom = (room: string) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit("join-room", { room });
    }
  };

  const leaveRoom = () => {
    if (socketRef.current && state.connected && state.currentRoom) {
      socketRef.current.emit("leave-room", { room: state.currentRoom });
      dispatch({ type: "LEAVE_ROOM" });
    }
  };

  // Message methods
  const sendMessage = (
    message: string,
    type: SocketMessage["type"] = "text",
    data?: unknown
  ) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit("send-message", {
        message,
        type,
        data,
        room: state.currentRoom,
      });
    }
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  // User methods
  const updateUserStatus = (status: SocketUser["status"]) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit("update-status", { status });
    }
  };

  // Utility methods
  const isConnected = () => state.connected;
  const getCurrentRoom = () => state.currentRoom;
  const getUsers = () => state.users;
  const getMessages = () => state.messages;

  const contextValue: SocketContextType = {
    state,
    dispatch,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearMessages,
    updateUserStatus,
    isConnected,
    getCurrentRoom,
    getUsers,
    getMessages,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the SocketContext
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
