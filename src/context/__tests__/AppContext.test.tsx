import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppProvider, useAppContext } from "../AppContext";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
    setThemeMode,
    setPrimaryColor,
    toggleSidebar,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    updateUserPreferences,
    resetState,
  } = useAppContext();

  return (
    <div>
      <div data-testid="theme-mode">{state.theme.mode}</div>
      <div data-testid="primary-color">{state.theme.primaryColor}</div>
      <div data-testid="sidebar-open">{state.ui.sidebarOpen.toString()}</div>
      <div data-testid="loading">{state.ui.loading.toString()}</div>
      <div data-testid="notifications-count">
        {state.ui.notifications.length}
      </div>
      <div data-testid="language">{state.user.preferences.language}</div>

      <button onClick={() => setThemeMode("dark")}>Set Dark Mode</button>
      <button onClick={() => setPrimaryColor("#ff0000")}>Set Red Color</button>
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
      <button onClick={() => setLoading(true)}>Set Loading</button>
      <button
        onClick={() =>
          addNotification({ type: "success", message: "Test notification" })
        }
      >
        Add Notification
      </button>
      <button onClick={() => removeNotification("test-id")}>
        Remove Notification
      </button>
      <button onClick={clearNotifications}>Clear Notifications</button>
      <button onClick={() => updateUserPreferences({ language: "es" })}>
        Update Language
      </button>
      <button onClick={resetState}>Reset State</button>
    </div>
  );
};

describe("AppContext", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides initial state correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
    expect(screen.getByTestId("primary-color")).toHaveTextContent("#1976d2");
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("notifications-count")).toHaveTextContent("0");
    expect(screen.getByTestId("language")).toHaveTextContent("en");
  });

  it("updates theme mode correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText("Set Dark Mode").click();
    });

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
  });

  it("updates primary color correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText("Set Red Color").click();
    });

    expect(screen.getByTestId("primary-color")).toHaveTextContent("#ff0000");
  });

  it("toggles sidebar correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false");

    act(() => {
      screen.getByText("Toggle Sidebar").click();
    });

    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("true");
  });

  it("sets loading state correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText("Set Loading").click();
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("true");
  });

  it("adds notifications correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText("Add Notification").click();
    });

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("1");
  });

  it("clears notifications correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add a notification first
    act(() => {
      screen.getByText("Add Notification").click();
    });

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("1");

    // Clear notifications
    act(() => {
      screen.getByText("Clear Notifications").click();
    });

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("0");
  });

  it("updates user preferences correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText("Update Language").click();
    });

    expect(screen.getByTestId("language")).toHaveTextContent("es");
  });

  it("resets state correctly", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Make some changes
    act(() => {
      screen.getByText("Set Dark Mode").click();
      screen.getByText("Toggle Sidebar").click();
      screen.getByText("Add Notification").click();
    });

    // Verify changes
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("true");
    expect(screen.getByTestId("notifications-count")).toHaveTextContent("1");

    // Reset state
    act(() => {
      screen.getByText("Reset State").click();
    });

    // Verify reset
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false");
    expect(screen.getByTestId("notifications-count")).toHaveTextContent("0");
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow("useAppContext must be used within an AppProvider");

    consoleSpy.mockRestore();
  });

  it("loads state from localStorage on mount", () => {
    const savedState = {
      theme: { mode: "dark", primaryColor: "#ff0000" },
      user: {
        preferences: { language: "es", notifications: false, analytics: true },
      },
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("primary-color")).toHaveTextContent("#ff0000");
    expect(screen.getByTestId("language")).toHaveTextContent("es");
  });

  it("handles localStorage errors gracefully", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("localStorage error");
    });

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Should still render with default state
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load app state from localStorage:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("auto-removes notifications after timeout", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add a notification
    act(() => {
      screen.getByText("Add Notification").click();
    });

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("1");

    // Fast-forward time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("0");
  });
});
