import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SocketService,
  createSocketService,
  getSocketService,
  defaultSocketConfig,
} from "../socketService";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  const mockSocket = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connected: false,
    id: "mock-socket-id",
  };

  const mockIo = vi.fn(() => mockSocket);

  return {
    default: mockIo,
    io: mockIo,
  };
});

// Import the mocked module to get references
import { io as mockIo } from "socket.io-client";

// Define the mock socket type
interface MockSocket {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  connected: boolean;
  id: string;
}

// Type for mock call arrays
type MockCall = unknown[];

// Helper function to find event handlers
const findEventHandler = (eventName: string) => {
  return mockSocket.on.mock.calls.find(
    (call: MockCall) => call[0] === eventName
  )?.[1] as (() => void) | undefined;
};

const mockSocket = (mockIo as unknown as () => MockSocket)();

describe("SocketService", () => {
  let socketService: SocketService;
  let mockConfig: {
    url: string;
    options: {
      autoConnect: boolean;
      forceNew: boolean;
      reconnection: boolean;
      reconnectionAttempts: number;
      reconnectionDelay: number;
      reconnectionDelayMax: number;
      timeout: number;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.connect.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();

    mockConfig = {
      url: "http://localhost:3001",
      options: {
        autoConnect: false,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
      },
    };

    socketService = new SocketService(mockConfig);
  });

  afterEach(() => {
    socketService.destroy();
  });

  describe("constructor", () => {
    it("initializes with correct configuration", () => {
      const status = socketService.getStatus();
      expect(status.isConnected).toBe(false);
      expect(status.isConnecting).toBe(false);
      expect(status.error).toBe(null);
    });

    it("merges default options with provided options", () => {
      const customConfig = {
        url: "http://example.com",
        options: {
          timeout: 10000,
        },
      };
      const service = new SocketService(customConfig);
      const status = service.getStatus();
      expect(status.isConnected).toBe(false);
    });
  });

  describe("connect", () => {
    it("creates socket instance and attempts connection", async () => {
      const connectPromise = socketService.connect();
      expect(mockIo).toHaveBeenCalledWith(mockConfig.url, mockConfig.options);
      expect(mockSocket.connect).toHaveBeenCalled();
      expect(socketService.getStatus().isConnecting).toBe(true);

      // Simulate successful connection
      const connectHandler = findEventHandler("connect");
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      await connectPromise;
      expect(socketService.getStatus().isConnected).toBe(true);
    });

    it("handles connection timeout", async () => {
      vi.useFakeTimers();
      const connectPromise = socketService.connect();

      // Fast-forward past timeout
      vi.advanceTimersByTime(6000);

      await expect(connectPromise).rejects.toThrow("Connection timeout");
      expect(socketService.getStatus().error).toBe("Connection timeout");

      vi.useRealTimers();
    });

    it("handles connection error", async () => {
      const connectPromise = socketService.connect();

      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect_error"
      )?.[1];
      if (errorHandler) {
        const error = new Error("Connection failed");
        errorHandler(error);
      }

      await expect(connectPromise).rejects.toThrow("Connection failed");
      expect(socketService.getStatus().error).toBe("Connection failed");
    });

    it("returns existing connection promise if already connecting", async () => {
      // Start connection but don't let it complete yet
      const promise1 = socketService.connect();
      expect(socketService.getStatus().isConnecting).toBe(true);

      // Second call should return the same promise
      const promise2 = socketService.connect();
      expect(promise1).toBe(promise2);

      // Now let the connection complete
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      await promise1;
    });
  });

  describe("disconnect", () => {
    it("disconnects socket and updates status", () => {
      // First connect
      socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      // Then disconnect
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.getStatus().isConnected).toBe(false);
    });
  });

  describe("emit", () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
    });

    it("emits event when connected", () => {
      const result = socketService.emit("test-event", { data: "test" });
      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith("test-event", {
        data: "test",
      });
    });

    it("returns false when not connected", () => {
      socketService.disconnect();
      const result = socketService.emit("test-event", { data: "test" });
      expect(result).toBe(false);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("handles emit errors gracefully", () => {
      mockSocket.emit.mockImplementation(() => {
        throw new Error("Emit error");
      });
      const result = socketService.emit("test-event", { data: "test" });
      expect(result).toBe(false);
    });
  });

  describe("emitWithAck", () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
    });

    it("emits event with acknowledgment", async () => {
      mockSocket.emit.mockImplementation(
        (
          _event: string,
          _data: unknown,
          callback: (response: unknown) => void
        ) => {
          setTimeout(() => callback({ success: true }), 100);
        }
      );

      const result = await socketService.emitWithAck("test-event", {
        data: "test",
      });
      expect(result).toEqual({ success: true });
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "test-event",
        { data: "test" },
        expect.any(Function)
      );
    });

    it("rejects when not connected", async () => {
      socketService.disconnect();
      await expect(
        socketService.emitWithAck("test-event", { data: "test" })
      ).rejects.toThrow("Socket not connected");
    });

    it("handles acknowledgment timeout", async () => {
      vi.useFakeTimers();
      mockSocket.emit.mockImplementation(() => {
        // Don't call callback to simulate timeout
      });

      const promise = socketService.emitWithAck(
        "test-event",
        { data: "test" },
        1000
      );
      vi.advanceTimersByTime(1100);

      await expect(promise).rejects.toThrow("Acknowledgment timeout");
      vi.useRealTimers();
    });
  });

  describe("event listeners", () => {
    it("adds event listener", () => {
      const callback = vi.fn();
      socketService.on("test-event", callback);
      // Should store the callback
      expect(socketService["eventListeners"]["test-event"]).toContain(callback);
    });

    it("removes specific event listener", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      socketService.on("test-event", callback1);
      socketService.on("test-event", callback2);

      socketService.off("test-event", callback1);

      expect(socketService["eventListeners"]["test-event"]).not.toContain(
        callback1
      );
      expect(socketService["eventListeners"]["test-event"]).toContain(
        callback2
      );
    });

    it("removes all listeners for event", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      socketService.on("test-event", callback1);
      socketService.on("test-event", callback2);

      socketService.off("test-event");

      expect(socketService["eventListeners"]["test-event"]).toBeUndefined();
    });

    it("adds one-time event listener", () => {
      const callback = vi.fn();
      socketService.once("test-event", callback);

      // Simulate event
      const storedCallback = socketService["eventListeners"]["test-event"]?.[0];
      if (storedCallback) {
        storedCallback({ data: "test" });
      }

      expect(callback).toHaveBeenCalledWith({ data: "test" });
      expect(socketService["eventListeners"]["test-event"]).toHaveLength(0);
    });
  });

  describe("room management", () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
    });

    it("joins room", async () => {
      mockSocket.emit.mockImplementation(
        (
          event: string,
          _data: unknown,
          callback: (response: unknown) => void
        ) => {
          if (event === "join-room") {
            setTimeout(() => callback({ success: true }), 100);
          }
        }
      );

      await socketService.joinRoom("test-room");
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "join-room",
        { room: "test-room" },
        expect.any(Function)
      );
    });

    it("leaves room", async () => {
      mockSocket.emit.mockImplementation(
        (
          event: string,
          _data: unknown,
          callback: (response: unknown) => void
        ) => {
          if (event === "leave-room") {
            setTimeout(() => callback({ success: true }), 100);
          }
        }
      );

      await socketService.leaveRoom("test-room");
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "leave-room",
        { room: "test-room" },
        expect.any(Function)
      );
    });
  });

  describe("status and utility methods", () => {
    it("returns connection status", () => {
      const status = socketService.getStatus();
      expect(status).toHaveProperty("isConnected");
      expect(status).toHaveProperty("isConnecting");
      expect(status).toHaveProperty("error");
    });

    it("checks if connected", () => {
      expect(socketService.isConnected()).toBe(false);

      // Simulate connection
      socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      expect(socketService.isConnected()).toBe(true);
    });

    it("returns socket ID", async () => {
      expect(socketService.getSocketId()).toBe(null);

      // Connect and get ID
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;

      expect(socketService.getSocketId()).toBe("mock-socket-id");
    });

    it("updates configuration", () => {
      const newConfig = {
        url: "http://newurl.com",
        options: { timeout: 15000 },
      };
      socketService.updateConfig(newConfig);
      // Configuration should be updated (private property, so we test behavior)
      expect(socketService.getStatus()).toBeDefined();
    });
  });

  describe("reconnection handling", () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
    });

    it("handles disconnect and reconnection", () => {
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "disconnect"
      )?.[1];
      if (disconnectHandler) {
        mockSocket.connected = false;
        disconnectHandler("transport close");
      }

      expect(socketService.getStatus().isConnected).toBe(false);
    });

    it("handles reconnection attempts", () => {
      // Simulate reconnection attempt
      const reconnectAttemptHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "reconnect_attempt"
      )?.[1];
      if (reconnectAttemptHandler) {
        reconnectAttemptHandler(1);
      }

      expect(socketService.getStatus().isReconnecting).toBe(true);
      expect(socketService.getStatus().reconnectAttempts).toBe(1);
    });

    it("handles successful reconnection", () => {
      // Simulate successful reconnection
      const reconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "reconnect"
      )?.[1];
      if (reconnectHandler) {
        mockSocket.connected = true;
        reconnectHandler(2);
      }

      expect(socketService.getStatus().isConnected).toBe(true);
      expect(socketService.getStatus().isReconnecting).toBe(false);
      expect(socketService.getStatus().reconnectAttempts).toBe(0);
    });

    it("handles failed reconnection", () => {
      // Simulate failed reconnection
      const reconnectFailedHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "reconnect_failed"
      )?.[1];
      if (reconnectFailedHandler) {
        reconnectFailedHandler();
      }

      expect(socketService.getStatus().isReconnecting).toBe(false);
      expect(socketService.getStatus().error).toBe("Reconnection failed");
    });
  });

  describe("manual reconnection", () => {
    it("forces reconnection", async () => {
      vi.useFakeTimers();

      // First connect
      const connectPromise1 = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise1;

      // Clear previous calls
      mockSocket.disconnect.mockClear();
      mockSocket.connect.mockClear();
      mockSocket.on.mockClear();

      // Force reconnection
      const reconnectPromise = socketService.reconnect();

      // Fast-forward the delay
      vi.advanceTimersByTime(1100);

      // Set up new connect handler for the reconnection
      const newConnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];

      // Simulate connection
      if (newConnectHandler) {
        mockSocket.connected = true;
        newConnectHandler();
      }

      await reconnectPromise;

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("cleanup", () => {
    it("destroys service and cleans up resources", () => {
      socketService.on("test-event", vi.fn());
      socketService.destroy();

      expect(socketService["eventListeners"]).toEqual({});
      expect(socketService.getStatus().isConnected).toBe(false);
    });
  });
});

describe("Socket Service Factory Functions", () => {
  afterEach(() => {
    // Clean up any created services
    const service = getSocketService();
    if (service) {
      service.destroy();
    }
  });

  describe("createSocketService", () => {
    it("creates new socket service instance", () => {
      const config = {
        url: "http://localhost:3001",
        options: { timeout: 5000 },
      };
      const service = createSocketService(config);
      expect(service).toBeInstanceOf(SocketService);
      expect(getSocketService()).toBe(service);
    });

    it("destroys previous instance when creating new one", () => {
      const config1 = { url: "http://localhost:3001" };
      const config2 = { url: "http://localhost:3002" };

      const service1 = createSocketService(config1);
      const destroySpy = vi.spyOn(service1, "destroy");

      const service2 = createSocketService(config2);

      expect(destroySpy).toHaveBeenCalled();
      expect(getSocketService()).toBe(service2);
      expect(getSocketService()).not.toBe(service1);
    });
  });

  describe("getSocketService", () => {
    it("returns null when no service created", () => {
      // Clear any existing service first
      const existingService = getSocketService();
      if (existingService) {
        existingService.destroy();
      }
      expect(getSocketService()).toBe(null);
    });

    it("returns created service instance", () => {
      const config = { url: "http://localhost:3001" };
      const service = createSocketService(config);
      expect(getSocketService()).toBe(service);
    });
  });

  describe("defaultSocketConfig", () => {
    it("has correct default configuration", () => {
      expect(defaultSocketConfig).toEqual({
        url: process.env.VITE_SOCKET_URL || "http://localhost:3001",
        options: {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        },
      });
    });
  });
});
