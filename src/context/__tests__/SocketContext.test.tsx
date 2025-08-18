import React from "react";
import {
  render,
  screen,
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SocketProvider, useSocket } from "../SocketContext";

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
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
  } = useSocket();

  return (
    <div>
      <div data-testid="connected">{state.connected.toString()}</div>
      <div data-testid="connecting">{state.connecting.toString()}</div>
      <div data-testid="error">{state.error || "none"}</div>
      <div data-testid="users-count">{state.users.length}</div>
      <div data-testid="messages-count">{state.messages.length}</div>
      <div data-testid="rooms-count">{state.rooms.length}</div>
      <div data-testid="current-room">{state.currentRoom || "none"}</div>

      <div data-testid="is-connected">{isConnected().toString()}</div>
      <div data-testid="get-current-room">{getCurrentRoom() || "none"}</div>
      <div data-testid="get-users-count">{getUsers().length}</div>
      <div data-testid="get-messages-count">{getMessages().length}</div>

      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => joinRoom("test-room")}>Join Room</button>
      <button onClick={leaveRoom}>Leave Room</button>
      <button onClick={() => sendMessage("Hello World")}>Send Message</button>
      <button onClick={clearMessages}>Clear Messages</button>
      <button onClick={() => updateUserStatus("away")}>Update Status</button>
    </div>
  );
};

describe("SocketContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides initial state correctly", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId("connected")).toHaveTextContent("false");
    expect(screen.getByTestId("connecting")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
    expect(screen.getByTestId("users-count")).toHaveTextContent("0");
    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
    expect(screen.getByTestId("rooms-count")).toHaveTextContent("0");
    expect(screen.getByTestId("current-room")).toHaveTextContent("none");
  });

  it("provides utility methods correctly", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId("is-connected")).toHaveTextContent("false");
    expect(screen.getByTestId("get-current-room")).toHaveTextContent("none");
    expect(screen.getByTestId("get-users-count")).toHaveTextContent("0");
    expect(screen.getByTestId("get-messages-count")).toHaveTextContent("0");
  });

  it("connects successfully", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Initially not connected
    expect(screen.getByTestId("connected")).toHaveTextContent("false");

    // Auto-connect should happen on mount
    act(() => {
      vi.advanceTimersByTime(3000); // Wait for connection delay
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Should have demo data loaded
    await waitFor(() => {
      expect(screen.getByTestId("rooms-count")).toHaveTextContent("3");
      expect(screen.getByTestId("users-count")).toHaveTextContent("2");
    });
  });

  it("handles manual connection", () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    act(() => {
      screen.getByText("Connect").click();
    });

    expect(screen.getByTestId("connecting")).toHaveTextContent("true");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("connected")).toHaveTextContent("true");
    expect(screen.getByTestId("connecting")).toHaveTextContent("false");
  });

  it("handles disconnection", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for auto-connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Disconnect
    act(() => {
      screen.getByText("Disconnect").click();
    });

    expect(screen.getByTestId("connected")).toHaveTextContent("false");
  });

  it("joins and leaves rooms", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Join room
    act(() => {
      screen.getByText("Join Room").click();
    });

    // Wait for room join response
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("current-room")).toHaveTextContent("test-room");
    });

    // Leave room
    act(() => {
      screen.getByText("Leave Room").click();
    });

    expect(screen.getByTestId("current-room")).toHaveTextContent("none");
  });

  it("sends and receives messages", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");

    // Send message
    act(() => {
      screen.getByText("Send Message").click();
    });

    // Wait for message response
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
    });
  });

  it("clears messages", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection and send a message
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    act(() => {
      screen.getByText("Send Message").click();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
    });

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

    // Wait for connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Update status (this would normally trigger server events)
    act(() => {
      screen.getByText("Update Status").click();
    });

    // The mock doesn't simulate status updates, but the method should not throw
    expect(screen.getByTestId("connected")).toHaveTextContent("true");
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSocket());
    }).toThrow("useSocket must be used within a SocketProvider");

    consoleSpy.mockRestore();
  });

  it("handles custom socket URL", () => {
    const customUrl = "ws://custom-server:3001";

    render(
      <SocketProvider socketUrl={customUrl}>
        <TestComponent />
      </SocketProvider>
    );

    // Should render without errors
    expect(screen.getByTestId("connected")).toHaveTextContent("false");
  });

  it("limits message history to 100 messages", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Simulate adding 105 messages
    for (let i = 0; i < 105; i++) {
      act(() => {
        screen.getByText("Send Message").click();
        vi.advanceTimersByTime(250);
      });
    }

    // Should only keep last 100 messages
    await waitFor(() => {
      expect(screen.getByTestId("messages-count")).toHaveTextContent("100");
    });
  });

  it("clears messages when joining a new room", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    // Send a message
    act(() => {
      screen.getByText("Send Message").click();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
    });

    // Join room (should clear messages)
    act(() => {
      screen.getByText("Join Room").click();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("current-room")).toHaveTextContent("test-room");
      expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
    });
  });
});
