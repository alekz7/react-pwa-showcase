import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import RealtimeDemo from "../RealtimeDemo";
import { SocketProvider } from "../../../context/SocketContext";

// Mock the socket context
vi.mock("../../../context/SocketContext", async () => {
  const actual = await vi.importActual("../../../context/SocketContext");
  return {
    ...actual,
    useSocket: () => ({
      isConnected: false,
      isConnecting: false,
      error: null,
      messages: [],
      users: [],
      currentRoom: null,
      currentUser: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      sendMessage: vi.fn(),
      joinRoom: vi.fn(),
      setCurrentUser: vi.fn(),
    }),
  };
});

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <SocketProvider>{children}</SocketProvider>
  </ThemeProvider>
);

describe("RealtimeDemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the join form when not connected", () => {
    render(
      <TestWrapper>
        <RealtimeDemo />
      </TestWrapper>
    );

    expect(
      screen.getByText("Real-time Communication Demo")
    ).toBeInTheDocument();
    expect(screen.getByText("Your Name")).toBeInTheDocument();
    expect(screen.getByText("Join Chat")).toBeInTheDocument();
  });

  it("displays the correct description", () => {
    render(
      <TestWrapper>
        <RealtimeDemo />
      </TestWrapper>
    );

    expect(
      screen.getByText(
        "Experience live chat and real-time data sharing using Socket.IO WebSocket connections."
      )
    ).toBeInTheDocument();
  });

  it("shows info alert about joining chat", () => {
    render(
      <TestWrapper>
        <RealtimeDemo />
      </TestWrapper>
    );

    expect(
      screen.getByText(
        "Enter your name to join the real-time chat demo. You'll be connected with other users currently viewing this page."
      )
    ).toBeInTheDocument();
  });
});
