import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SocketProvider, useSocket } from "../SocketContext";

// Mock the SocketService
const mockSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  reconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  getStatus: vi.fn(),
  isConnected: vi.fn(),
  getSocketId: vi.fn(),
  destroy: vi.fn(),
};

// Mock the socket service module
vi.mock("../../services/socketService", () => ({
  SocketService: vi.fn(() => mockSocketService),
  createSocketService: vi.fn(() => mockSocketService),
  getSocketService: vi.fn(() => mockSocketService),
  defaultSocketConfig: {
    url: "http://localhost:3001",
    options: {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    },
  },
}));

// Test component to access socket context
const TestComponent: React.FC = () => {
  const {
    socketService,
    isConnected,
    isConnecting,
    isReconnecting,
    error,
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
    setCurrentUser,
  } = useSocket();

  return (
    <div>
      <div data-testid="socket-service">
        {socketService ? "has-service" : "no-service"}
      </div>
      <div data-testid="is-connected">{isConnected.toString()}</div>
      <div data-testid="is-connecting">{isConnecting.toString()}</div>
      <div data-testid="is-reconnecting">{isReconnecting.toString()}</div>
      <div data-testid="error">{error || "no-error"}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="current-room">{currentRoom || "no-room"}</div>
      <div data-testid="current-user">{currentUser?.name || "no-user"}</div>
      <div data-testid="connection-status">
        {JSON.stringify(connectionStatus)}
      </div>
      <button onClick={() => connect()}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={() => sendMessage("test message")}>Send Message</button>
      <button onClick={() => joinRoom("test-room")}>Join Room</button>
      <button onClick={() => leaveRoom("test-room")}>Leave Room</button>
      <button onClick={clearMessages}>Clear Messages</button>
      <button onClick={() => updateUserStatus("online")}>Update Status</button>
      <button
        onClick={() =>
          setCurrentUser({ id: "1", name: "Test User", status: "online" })
        }
      >
        Set User
      </button>
    </div>
  );
};

describe("SocketContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock return values
    mockSocketService.getStatus.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
      lastDisconnected: null,
    });
    mockSocketService.isConnected.mockReturnValue(false);
    mockSocketService.connect.mockResolvedValue(undefined);
    mockSocketService.joinRoom.mockResolvedValue(undefined);
    mockSocketService.leaveRoom.mockResolvedValue(undefined);
    mockSocketService.emit.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("provides initial state correctly", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId("socket-service")).toHaveTextContent(
      "no-service"
    );
    expect(screen.getByTestId("is-connected")).toHaveTextContent("false");
    expect(screen.getByTestId("is-connecting")).toHaveTextContent("false");
    expect(screen.getByTestId("is-reconnecting")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
    expect(screen.getByTestId("users-count")).toHaveTextContent("0");
    expect(screen.getByTestId("current-room")).toHaveTextContent("no-room");
    expect(screen.getByTestId("current-user")).toHaveTextContent("no-user");
  });

  it("connects successfully", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Initially not connected
    expect(screen.getByTestId("is-connected")).toHaveTextContent("false");

    // Click connect
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for the service to be created and connect to be called
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    expect(screen.getByTestId("socket-service")).toHaveTextContent(
      "has-service"
    );
  });

  it("handles disconnection", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // First connect
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Then disconnect
    act(() => {
      screen.getByText("Disconnect").click();
    });

    expect(mockSocketService.disconnect).toHaveBeenCalled();
  });

  it("handles reconnection", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // First connect
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Then reconnect
    act(() => {
      screen.getByText("Reconnect").click();
    });

    expect(mockSocketService.reconnect).toHaveBeenCalled();
  });

  it("sends messages when connected with current user", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Set up connected state
    mockSocketService.getStatus.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: new Date(),
      lastDisconnected: null,
    });

    // Set user
    act(() => {
      screen.getByText("Set User").click();
    });

    // Send message
    act(() => {
      screen.getByText("Send Message").click();
    });

    expect(mockSocketService.emit).toHaveBeenCalledWith(
      "send-message",
      expect.objectContaining({
        user: "Test User",
        content: "test message",
        timestamp: expect.any(Number),
      })
    );
  });

  it("joins and leaves rooms", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Set up connected state
    mockSocketService.getStatus.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: new Date(),
      lastDisconnected: null,
    });

    // Join room
    act(() => {
      screen.getByText("Join Room").click();
    });

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith("test-room");

    // Leave room
    act(() => {
      screen.getByText("Leave Room").click();
    });

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith("test-room");
  });

  it("clears messages", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Clear messages
    act(() => {
      screen.getByText("Clear Messages").click();
    });

    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
  });

  it("updates user status", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Set up connected state
    mockSocketService.getStatus.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: new Date(),
      lastDisconnected: null,
    });

    // Set user
    act(() => {
      screen.getByText("Set User").click();
    });

    // Update status
    act(() => {
      screen.getByText("Update Status").click();
    });

    expect(mockSocketService.emit).toHaveBeenCalledWith("update-status", {
      userId: "1",
      status: "online",
    });
  });

  it("sets current user", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId("current-user")).toHaveTextContent("no-user");

    // Set user
    act(() => {
      screen.getByText("Set User").click();
    });

    expect(screen.getByTestId("current-user")).toHaveTextContent("Test User");
  });

  it("handles socket events", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect to set up event listeners
    act(() => {
      screen.getByText("Connect").click();
    });

    // Verify that event listeners were set up
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "user-joined",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "user-left",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "user-status-changed",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "room-joined",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "room-left",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "users-list",
      expect.any(Function)
    );
    expect(mockSocketService.on).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });

  it("handles connection errors gracefully", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Mock connection error
    mockSocketService.connect.mockRejectedValue(new Error("Connection failed"));
    mockSocketService.getStatus.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: "Connection failed",
      reconnectAttempts: 0,
      lastConnected: null,
      lastDisconnected: null,
    });

    // Try to connect
    act(() => {
      screen.getByText("Connect").click();
    });

    // Should handle error gracefully
    expect(mockSocketService.connect).toHaveBeenCalled();
  });

  it("handles room join/leave errors gracefully", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    act(() => {
      screen.getByText("Connect").click();
    });

    // Wait for connection
    await waitFor(() => {
      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    // Set up connected state
    mockSocketService.getStatus.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: new Date(),
      lastDisconnected: null,
    });

    // Mock room join error
    mockSocketService.joinRoom.mockRejectedValue(new Error("Room join failed"));

    // Try to join room - should handle error gracefully
    act(() => {
      screen.getByText("Join Room").click();
    });

    expect(mockSocketService.joinRoom).toHaveBeenCalled();
  });
});
