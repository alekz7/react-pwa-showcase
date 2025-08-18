// Global type definitions for context state management

export interface AppState {
  theme: {
    mode: "light" | "dark";
    primaryColor: string;
  };
  ui: {
    sidebarOpen: boolean;
    loading: boolean;
    notifications: Notification[];
  };
  user: {
    preferences: UserPreferences;
  };
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  autoHide?: boolean;
}

export interface UserPreferences {
  language: string;
  notifications: boolean;
  analytics: boolean;
}

export type AppAction =
  | { type: "SET_THEME_MODE"; payload: "light" | "dark" }
  | { type: "SET_PRIMARY_COLOR"; payload: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "ADD_NOTIFICATION";
      payload: Omit<Notification, "id" | "timestamp">;
    }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "UPDATE_USER_PREFERENCES"; payload: Partial<UserPreferences> }
  | { type: "RESET_STATE" };

// Device Context Types
export interface DeviceCapabilities {
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  deviceMotion: boolean;
  fileSystem: boolean;
  notifications: boolean;
  serviceWorker: boolean;
}

export interface DevicePermissions {
  camera: PermissionState;
  microphone: PermissionState;
  geolocation: PermissionState;
  notifications: PermissionState;
}

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export interface DeviceState {
  capabilities: DeviceCapabilities;
  permissions: DevicePermissions;
  isOnline: boolean;
  batteryLevel?: number;
  networkType?: string;
}

export type DeviceAction =
  | { type: "SET_CAPABILITIES"; payload: DeviceCapabilities }
  | {
      type: "UPDATE_PERMISSION";
      payload: { permission: keyof DevicePermissions; state: PermissionState };
    }
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "SET_BATTERY_LEVEL"; payload: number }
  | { type: "SET_NETWORK_TYPE"; payload: string };

// Socket Context Types
export interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  users: SocketUser[];
  messages: SocketMessage[];
  rooms: string[];
  currentRoom: string | null;
}

export interface SocketUser {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen: number;
}

export interface SocketMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: "text" | "system" | "location" | "file";
  data?: unknown;
}

export type SocketAction =
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_CONNECTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_USER"; payload: SocketUser }
  | { type: "REMOVE_USER"; payload: string }
  | {
      type: "UPDATE_USER";
      payload: { id: string; updates: Partial<SocketUser> };
    }
  | { type: "ADD_MESSAGE"; payload: SocketMessage }
  | { type: "CLEAR_MESSAGES" }
  | { type: "JOIN_ROOM"; payload: string }
  | { type: "LEAVE_ROOM" }
  | { type: "SET_ROOMS"; payload: string[] };
