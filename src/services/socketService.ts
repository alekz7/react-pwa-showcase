import io from "socket.io-client";

export interface SocketConfig {
  url: string;
  options?: {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    forceNew?: boolean;
  };
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
}

export interface SocketEventCallback<T = unknown> {
  (data: T): void;
}

export interface SocketEventListeners {
  [event: string]: SocketEventCallback<unknown>[];
}

export class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private config: SocketConfig;
  private status: ConnectionStatus;
  private eventListeners: SocketEventListeners = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: SocketConfig) {
    this.config = {
      url: config.url,
      options: {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        ...config.options,
      },
    };

    this.status = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
      lastDisconnected: null,
    };
  }

  /**
   * Connect to the Socket.IO server
   */
  async connect(): Promise<void> {
    if (this.status.isConnected) {
      return Promise.resolve();
    }

    if (this.status.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.updateStatus({ isConnecting: true, error: null });

        // Create socket instance
        this.socket = io(this.config.url, this.config.options);

        // Set up event listeners
        this.setupSocketEventListeners(resolve, reject);

        // Start connection
        this.socket.connect();

        // Set connection timeout
        const timeout = setTimeout(() => {
          if (!this.status.isConnected) {
            this.updateStatus({
              isConnecting: false,
              error: "Connection timeout",
            });
            reject(new Error("Connection timeout"));
          }
        }, this.config.options?.timeout || 20000);

        // Clear timeout on successful connection
        this.socket.on("connect", () => {
          clearTimeout(timeout);
        });
      } catch (error) {
        this.updateStatus({
          isConnecting: false,
          error: error instanceof Error ? error.message : "Connection failed",
        });
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.clearTimers();
    this.updateStatus({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      lastDisconnected: new Date(),
    });
    this.connectionPromise = null;
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: unknown): boolean {
    if (!this.socket || !this.status.isConnected) {
      console.warn(`Cannot emit event "${event}": Socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting event "${event}":`, error);
      return false;
    }
  }

  /**
   * Emit an event with acknowledgment
   */
  emitWithAck(event: string, data?: unknown, timeout = 5000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.status.isConnected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error("Acknowledgment timeout"));
      }, timeout);

      try {
        this.socket.emit(event, data, (response: unknown) => {
          clearTimeout(timer);
          resolve(response);
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Add event listener
   */
  on<T = unknown>(event: string, callback: SocketEventCallback<T>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback as SocketEventCallback<unknown>);

    // If socket exists, add listener immediately
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off<T = unknown>(event: string, callback?: SocketEventCallback<T>): void {
    if (callback) {
      // Remove specific callback
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          (cb) => cb !== callback
        );
      }
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      // Remove all listeners for event
      delete this.eventListeners[event];
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * Add one-time event listener
   */
  once<T = unknown>(event: string, callback: SocketEventCallback<T>): void {
    const onceCallback = (data: unknown) => {
      callback(data as T);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Join a room
   */
  async joinRoom(room: string): Promise<void> {
    await this.emitWithAck("join-room", { room });
  }

  /**
   * Leave a room
   */
  async leaveRoom(room: string): Promise<void> {
    await this.emitWithAck("leave-room", { room });
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.status.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SocketConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      options: {
        ...this.config.options,
        ...config.options,
      },
    };
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.connect();
  }

  /**
   * Set up socket event listeners
   */
  private setupSocketEventListeners(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on("connect", () => {
      this.updateStatus({
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        error: null,
        reconnectAttempts: 0,
        lastConnected: new Date(),
      });
      this.startHeartbeat();
      this.reattachEventListeners();
      resolve();
    });

    // Connection error
    this.socket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      this.updateStatus({
        isConnecting: false,
        isReconnecting: false,
        error: error.message,
      });
      reject(error);
    });

    // Disconnection
    this.socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
      this.updateStatus({
        isConnected: false,
        lastDisconnected: new Date(),
      });
      this.clearTimers();

      // Handle automatic reconnection
      if (reason === "io server disconnect") {
        // Server initiated disconnect - don't reconnect automatically
        this.updateStatus({ error: "Server disconnected" });
      } else if (this.config.options?.reconnection) {
        // Client-side disconnect - attempt reconnection
        this.handleReconnection();
      }
    });

    // Reconnection attempt
    this.socket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.updateStatus({
        isReconnecting: true,
        reconnectAttempts: attemptNumber,
      });
    });

    // Reconnection successful
    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.updateStatus({
        isConnected: true,
        isReconnecting: false,
        error: null,
        reconnectAttempts: 0,
        lastConnected: new Date(),
      });
    });

    // Reconnection failed
    this.socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      this.updateStatus({
        isReconnecting: false,
        error: "Reconnection failed",
      });
    });

    // Pong response for heartbeat
    this.socket.on("pong", () => {
      // Heartbeat received - connection is alive
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectTimer) return;

    const maxAttempts = this.config.options?.reconnectionAttempts || 5;
    const delay = this.config.options?.reconnectionDelay || 1000;

    if (this.status.reconnectAttempts < maxAttempts) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.updateStatus({
          isReconnecting: true,
          reconnectAttempts: this.status.reconnectAttempts + 1,
        });
        this.connect().catch(() => {
          // Reconnection failed, will try again
        });
      }, delay);
    } else {
      this.updateStatus({
        error: "Max reconnection attempts reached",
        isReconnecting: false,
      });
    }
  }

  /**
   * Reattach event listeners after reconnection
   */
  private reattachEventListeners(): void {
    if (!this.socket) return;

    Object.entries(this.eventListeners).forEach(([event, callbacks]) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback);
      });
    });
  }

  /**
   * Start heartbeat to monitor connection
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.status.isConnected) {
        this.socket.emit("ping");
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update connection status
   */
  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.eventListeners = {};
    this.clearTimers();

    // Clear global reference if this is the default service
    if (defaultSocketService === this) {
      defaultSocketService = null;
    }
  }
}

// Default socket service instance
let defaultSocketService: SocketService | null = null;

/**
 * Create or get default socket service instance
 */
export const createSocketService = (config: SocketConfig): SocketService => {
  if (defaultSocketService) {
    defaultSocketService.destroy();
    defaultSocketService = null;
  }
  defaultSocketService = new SocketService(config);
  return defaultSocketService;
};

/**
 * Get default socket service instance
 */
export const getSocketService = (): SocketService | null => {
  return defaultSocketService;
};

/**
 * Default configuration for development
 */
export const defaultSocketConfig: SocketConfig = {
  url: process.env.VITE_SOCKET_URL || "http://localhost:3001",
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  },
};
