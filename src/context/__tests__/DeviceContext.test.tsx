import { describe, it, expect, beforeEach, vi } from "vitest";

// Set up all mocks BEFORE any imports
const mockGetUserMedia = vi.fn();
const mockGetCurrentPosition = vi.fn();
const mockPermissionsQuery = vi.fn();
const mockNotificationRequestPermission = vi.fn();

// Create comprehensive navigator mock
const mockNavigator = {
  mediaDevices: {
    getUserMedia: mockGetUserMedia,
  },
  geolocation: {
    getCurrentPosition: mockGetCurrentPosition,
  },
  permissions: {
    query: mockPermissionsQuery,
  },
  onLine: true,
  serviceWorker: {}, // Mock service worker
};

// Mock Notification API
const mockNotification = {
  requestPermission: mockNotificationRequestPermission,
};

// Set up global mocks BEFORE imports
Object.defineProperty(global, "navigator", {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "Notification", {
  value: mockNotification,
  writable: true,
  configurable: true,
});

// Mock DeviceMotionEvent and DeviceOrientationEvent
Object.defineProperty(global, "DeviceMotionEvent", {
  value: function DeviceMotionEvent() {},
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "DeviceOrientationEvent", {
  value: function DeviceOrientationEvent() {},
  writable: true,
  configurable: true,
});

// Mock File APIs
Object.defineProperty(global, "File", {
  value: function File() {},
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "FileReader", {
  value: function FileReader() {},
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "FileList", {
  value: function FileList() {},
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "Blob", {
  value: function Blob() {},
  writable: true,
  configurable: true,
});

// Mock the constants module to return our expected capabilities
vi.mock("../constants", () => ({
  initialUserPreferences: {
    language: "en",
    notifications: true,
    analytics: false,
  },
  detectDeviceCapabilities: vi.fn(() => ({
    camera: true,
    microphone: true,
    geolocation: true,
    deviceMotion: true,
    fileSystem: true,
    notifications: true,
    serviceWorker: true,
  })),
  createMockSocket: vi.fn(),
}));

// Now import React components after mocks are set up
import React from "react";
import {
  render,
  screen,
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { DeviceProvider, useDeviceContext } from "../DeviceContext";

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
    checkPermission,
    requestPermission,
    refreshCapabilities,
    getBatteryInfo,
    getNetworkInfo,
  } = useDeviceContext();

  return (
    <div>
      <div data-testid="camera-capability">
        {state.capabilities.camera.toString()}
      </div>
      <div data-testid="microphone-capability">
        {state.capabilities.microphone.toString()}
      </div>
      <div data-testid="geolocation-capability">
        {state.capabilities.geolocation.toString()}
      </div>
      <div data-testid="device-motion-capability">
        {state.capabilities.deviceMotion.toString()}
      </div>
      <div data-testid="file-system-capability">
        {state.capabilities.fileSystem.toString()}
      </div>
      <div data-testid="notifications-capability">
        {state.capabilities.notifications.toString()}
      </div>
      <div data-testid="service-worker-capability">
        {state.capabilities.serviceWorker.toString()}
      </div>

      <div data-testid="camera-permission">{state.permissions.camera}</div>
      <div data-testid="microphone-permission">
        {state.permissions.microphone}
      </div>
      <div data-testid="geolocation-permission">
        {state.permissions.geolocation}
      </div>
      <div data-testid="notifications-permission">
        {state.permissions.notifications}
      </div>

      <div data-testid="online-status">{state.isOnline.toString()}</div>
      <div data-testid="battery-level">{state.batteryLevel || "unknown"}</div>
      <div data-testid="network-type">{state.networkType || "unknown"}</div>

      <button onClick={() => checkPermission("camera")}>
        Check Camera Permission
      </button>
      <button onClick={() => requestPermission("camera")}>
        Request Camera Permission
      </button>
      <button onClick={() => requestPermission("geolocation")}>
        Request Geolocation Permission
      </button>
      <button onClick={() => requestPermission("notifications")}>
        Request Notifications Permission
      </button>
      <button onClick={refreshCapabilities}>Refresh Capabilities</button>
      <button onClick={getBatteryInfo}>Get Battery Info</button>
      <button onClick={getNetworkInfo}>Get Network Info</button>
    </div>
  );
};

describe("DeviceContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset navigator properties
    mockNavigator.onLine = true;

    // Reset permission query mock
    mockPermissionsQuery.mockResolvedValue({ state: "prompt" });

    // Reset notification permission mock
    mockNotificationRequestPermission.mockResolvedValue("granted");
  });

  it("provides initial device capabilities correctly", () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    expect(screen.getByTestId("camera-capability")).toHaveTextContent("true");
    expect(screen.getByTestId("microphone-capability")).toHaveTextContent(
      "true"
    );
    expect(screen.getByTestId("geolocation-capability")).toHaveTextContent(
      "true"
    );
    expect(screen.getByTestId("device-motion-capability")).toHaveTextContent(
      "true"
    );
    expect(screen.getByTestId("file-system-capability")).toHaveTextContent(
      "true"
    );
    expect(screen.getByTestId("notifications-capability")).toHaveTextContent(
      "true"
    );
  });

  it("provides initial permission states", () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    expect(screen.getByTestId("camera-permission")).toHaveTextContent(
      "unknown"
    );
    expect(screen.getByTestId("microphone-permission")).toHaveTextContent(
      "unknown"
    );
    expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
      "unknown"
    );
    expect(screen.getByTestId("notifications-permission")).toHaveTextContent(
      "unknown"
    );
  });

  it("provides initial online status", () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    expect(screen.getByTestId("online-status")).toHaveTextContent("true");
  });

  it("checks camera permission correctly", async () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "prompt"
      );
    });

    // Now set up the mock to return granted for the next check
    mockPermissionsQuery.mockResolvedValue({ state: "granted" });

    await act(async () => {
      screen.getByText("Check Camera Permission").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("camera-permission")).toHaveTextContent(
          "granted"
        );
      },
      { timeout: 3000 }
    );

    expect(mockPermissionsQuery).toHaveBeenCalledWith({
      name: "camera",
    });
  });

  it("requests camera permission successfully", async () => {
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };
    mockGetUserMedia.mockResolvedValue(mockStream);

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "prompt"
      );
    });

    await act(async () => {
      screen.getByText("Request Camera Permission").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("camera-permission")).toHaveTextContent(
          "granted"
        );
      },
      { timeout: 3000 }
    );

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: true,
    });
  });

  it("handles camera permission denial", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "prompt"
      );
    });

    await act(async () => {
      screen.getByText("Request Camera Permission").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("camera-permission")).toHaveTextContent(
          "denied"
        );
      },
      { timeout: 3000 }
    );
  });

  it("requests geolocation permission successfully", async () => {
    mockGetCurrentPosition.mockImplementation(
      (success: (position: GeolocationPosition) => void) => {
        setTimeout(() => {
          success({
            coords: { latitude: 0, longitude: 0 },
          } as GeolocationPosition);
        }, 0);
      }
    );

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
        "prompt"
      );
    });

    await act(async () => {
      screen.getByText("Request Geolocation Permission").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
          "granted"
        );
      },
      { timeout: 3000 }
    );
  });

  it("handles geolocation permission denial", async () => {
    mockGetCurrentPosition.mockImplementation(
      (
        _success: (position: GeolocationPosition) => void,
        error: (error: GeolocationPositionError) => void
      ) => {
        setTimeout(() => {
          error({ code: 1 } as GeolocationPositionError); // PERMISSION_DENIED
        }, 0);
      }
    );

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
        "prompt"
      );
    });

    await act(async () => {
      screen.getByText("Request Geolocation Permission").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
          "denied"
        );
      },
      { timeout: 3000 }
    );
  });

  it("requests notification permission successfully", async () => {
    mockNotificationRequestPermission.mockResolvedValue("granted");

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Wait for initial permission checks to complete - notifications might be "prompt" or "unknown"
    await waitFor(() => {
      const permissionText = screen.getByTestId(
        "notifications-permission"
      ).textContent;
      expect(permissionText).toMatch(/^(prompt|unknown)$/);
    });

    await act(async () => {
      screen.getByText("Request Notifications Permission").click();
    });

    await waitFor(
      () => {
        expect(
          screen.getByTestId("notifications-permission")
        ).toHaveTextContent("granted");
      },
      { timeout: 3000 }
    );

    expect(mockNotificationRequestPermission).toHaveBeenCalled();
  });

  it("refreshes capabilities correctly", () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    act(() => {
      screen.getByText("Refresh Capabilities").click();
    });

    // Capabilities should remain the same since we're not changing the mocked APIs
    expect(screen.getByTestId("camera-capability")).toHaveTextContent("true");
    expect(screen.getByTestId("microphone-capability")).toHaveTextContent(
      "true"
    );
  });

  it("handles online/offline events", () => {
    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    expect(screen.getByTestId("online-status")).toHaveTextContent("true");

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByTestId("online-status")).toHaveTextContent("false");

    // Simulate going back online
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.getByTestId("online-status")).toHaveTextContent("true");
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDeviceContext());
    }).toThrow("useDeviceContext must be used within a DeviceProvider");

    consoleSpy.mockRestore();
  });

  it("handles permission check errors gracefully", async () => {
    mockPermissionsQuery.mockRejectedValue(new Error("Permission API error"));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Check Camera Permission").click();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to check camera permission:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("detects capabilities correctly when APIs are not available", async () => {
    // Import the mocked constants module
    const { detectDeviceCapabilities } = await import("../constants");

    // Mock the function to return false capabilities
    vi.mocked(detectDeviceCapabilities).mockReturnValue({
      camera: false,
      microphone: false,
      geolocation: false,
      deviceMotion: false,
      fileSystem: false,
      notifications: false,
      serviceWorker: false,
    });

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    // Trigger refresh capabilities to use the new mock
    act(() => {
      screen.getByText("Refresh Capabilities").click();
    });

    expect(screen.getByTestId("camera-capability")).toHaveTextContent("false");
    expect(screen.getByTestId("microphone-capability")).toHaveTextContent(
      "false"
    );
    expect(screen.getByTestId("geolocation-capability")).toHaveTextContent(
      "false"
    );

    // Restore the mock to return true capabilities
    vi.mocked(detectDeviceCapabilities).mockReturnValue({
      camera: true,
      microphone: true,
      geolocation: true,
      deviceMotion: true,
      fileSystem: true,
      notifications: true,
      serviceWorker: true,
    });
  });
});
