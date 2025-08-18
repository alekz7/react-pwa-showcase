// Constants and utility functions for context providers

import type { UserPreferences } from "./types";

// Initial user preferences
export const initialUserPreferences: UserPreferences = {
  language: "en",
  notifications: true,
  analytics: false,
};

// Device capability detection utilities
export const detectDeviceCapabilities = () => {
  return {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    microphone: !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ),
    geolocation: !!navigator.geolocation,
    deviceMotion: !!(window.DeviceMotionEvent || window.DeviceOrientationEvent),
    fileSystem: !!(
      window.File &&
      window.FileReader &&
      window.FileList &&
      window.Blob
    ),
    notifications: !!("Notification" in window),
    serviceWorker: !!("serviceWorker" in navigator),
  };
};

// Mock Socket.IO interface for development/testing
export interface MockSocket {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (data?: unknown) => void) => void;
  off: (event: string, callback?: (data?: unknown) => void) => void;
}

// Create a mock socket for development
export const createMockSocket = (): MockSocket => {
  const eventListeners: { [key: string]: ((data?: unknown) => void)[] } = {};
  let connected = false;
  let connectTimeout: NodeJS.Timeout | null = null;

  return {
    connected,
    connect() {
      if (connectTimeout) clearTimeout(connectTimeout);
      connectTimeout = setTimeout(
        () => {
          connected = true;
          this.connected = true;
          const connectCallbacks = eventListeners["connect"] || [];
          connectCallbacks.forEach((callback) => callback());
        },
        1000 + Math.random() * 2000
      ); // Simulate connection delay
    },
    disconnect() {
      if (connectTimeout) {
        clearTimeout(connectTimeout);
        connectTimeout = null;
      }
      connected = false;
      this.connected = false;
      const disconnectCallbacks = eventListeners["disconnect"] || [];
      disconnectCallbacks.forEach((callback) => callback());
    },
    emit(event: string, data?: unknown) {
      // Simulate server responses for demo purposes
      if (event === "join-room" && data) {
        setTimeout(() => {
          const joinCallbacks = eventListeners["room-joined"] || [];
          joinCallbacks.forEach((callback) =>
            callback({ room: (data as { room: string }).room })
          );
        }, 500);
      }
      if (event === "send-message" && data) {
        setTimeout(() => {
          const messageCallbacks = eventListeners["message"] || [];
          const mockMessage = {
            id: Date.now().toString(),
            userId: "demo-user",
            userName: "Demo User",
            message: (data as { message: string }).message,
            timestamp: Date.now(),
            type: "text",
          };
          messageCallbacks.forEach((callback) => callback(mockMessage));
        }, 200);
      }
    },
    on(event: string, callback: (data?: unknown) => void) {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    },
    off(event: string, callback?: (data?: unknown) => void) {
      if (!eventListeners[event]) return;
      if (callback) {
        eventListeners[event] = eventListeners[event].filter(
          (cb) => cb !== callback
        );
      } else {
        delete eventListeners[event];
      }
    },
  };
};
