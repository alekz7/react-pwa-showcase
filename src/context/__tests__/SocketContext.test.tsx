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

// Configure longer timeout for all tests
vi.setConfig({ testTimeout: 30000 });

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

  const [userStatus, setUserStatus] = React.useState<string>("offline");

  return (
    <div>
      <div data-testid="connected">{state.connected.toString()}</div>
      <div data-testid="connecting">{state.connecting.toString()}</div>
      <div data-testid="error">{state.error || "none"}</div>
      <div data-testid="users-count">{state.users.length}</div>
      <div data-testid="messages-count">{state.messages.length}</div>
      <div data-testid="rooms-count">{state.rooms.length}</div>
      <div data-testid="current-room">{state.currentRoom || "none"}</div>
      <div data-testid="user-status">{userStatus}</div>

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
      <button
        onClick={() => {
          updateUserStatus("online");
          setUserStatus("online");
        }}
      >
        Update Status
      </button>
    </div>
  );
};

describe("SocketContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    // Auto-connect should happen on mount - wait for it
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Should have demo data loaded
    await waitFor(
      () => {
        expect(screen.getByTestId("rooms-count")).toHaveTextContent("3");
        expect(screen.getByTestId("users-count")).toHaveTextContent("2");
      },
      { timeout: 10000 }
    );
  }, 20000);

  it("handles manual connection", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for auto-connection first, then disconnect to test manual connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Disconnect first
    act(() => {
      screen.getByText("Disconnect").click();
    });

    expect(screen.getByTestId("connected")).toHaveTextContent("false");

    // Now test manual connection
    act(() => {
      screen.getByText("Connect").click();
    });

    expect(screen.getByTestId("connecting")).toHaveTextContent("true");

    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
        expect(screen.getByTestId("connecting")).toHaveTextContent("false");
      },
      { timeout: 10000 }
    );
  }, 20000);

  it("handles disconnection", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for auto-connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Disconnect
    act(() => {
      screen.getByText("Disconnect").click();
    });

    expect(screen.getByTestId("connected")).toHaveTextContent("false");
  }, 20000);

  it("joins and leaves rooms", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Join room
    act(() => {
      screen.getByText("Join Room").click();
    });

    // Wait for room join response
    await waitFor(
      () => {
        expect(screen.getByTestId("current-room")).toHaveTextContent(
          "test-room"
        );
      },
      { timeout: 10000 }
    );

    // Leave room
    act(() => {
      screen.getByText("Leave Room").click();
    });

    expect(screen.getByTestId("current-room")).toHaveTextContent("none");
  }, 20000);

  it("sends and receives messages", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");

    // Send message
    act(() => {
      screen.getByText("Send Message").click();
    });

    // Wait for message response
    await waitFor(
      () => {
        expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
      },
      { timeout: 10000 }
    );
  }, 20000);

  it("clears messages", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection and send a message
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    act(() => {
      screen.getByText("Send Message").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
      },
      { timeout: 10000 }
    );

    // Clear messages
    act(() => {
      screen.getByText("Clear Messages").click();
    });

    expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
  }, 20000);

  it("updates user status", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Update status (this would normally trigger server events)
    act(() => {
      screen.getByText("Update Status").click();
    });

    // The mock doesn't simulate status updates, but the method should not throw
    expect(screen.getByTestId("connected")).toHaveTextContent("true");
  }, 20000);

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

    // Wait for auto-connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Send 105 messages rapidly
    for (let i = 0; i < 105; i++) {
      act(() => {
        screen.getByText("Send Message").click();
      });
    }

    // Wait for all messages to be processed and then check the limit
    await waitFor(
      () => {
        expect(screen.getByTestId("messages-count")).toHaveTextContent("100");
      },
      { timeout: 20000 }
    );
  }, 30000);

  it("clears messages when joining a new room", async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Wait for auto-connection
    await waitFor(
      () => {
        expect(screen.getByTestId("connected")).toHaveTextContent("true");
      },
      { timeout: 15000 }
    );

    // Send a message and wait for it to be processed
    act(() => {
      screen.getByText("Send Message").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("messages-count")).toHaveTextContent("1");
      },
      { timeout: 10000 }
    );

    // Join room (should clear messages)
    act(() => {
      screen.getByText("Join Room").click();
    });

    // Wait for room to be joined and messages to be cleared
    await waitFor(
      () => {
        expect(screen.getByTestId("current-room")).toHaveTextContent(
          "test-room"
        );
      },
      { timeout: 10000 }
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("messages-count")).toHaveTextContent("0");
      },
      { timeout: 10000 }
    );
  }, 25000);
});
