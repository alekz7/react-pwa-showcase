import React from "react";
import {
  render,
  screen,
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeviceProvider, useDeviceContext } from "../DeviceContext";

// Mock navigator APIs
const mockNavigator = {
  mediaDevices: {
    getUserMedia: vi.fn(),
  },
  geolocation: {
    getCurrentPosition: vi.fn(),
  },
  permissions: {
    query: vi.fn(),
  },
  onLine: true,
};

// Mock Notification API
const mockNotification = {
  requestPermission: vi.fn(),
};

Object.defineProperty(window, "navigator", {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(window, "Notification", {
  value: mockNotification,
  writable: true,
});

// Mock DeviceMotionEvent and DeviceOrientationEvent
Object.defineProperty(window, "DeviceMotionEvent", {
  value: function DeviceMotionEvent() {},
  writable: true,
});

Object.defineProperty(window, "DeviceOrientationEvent", {
  value: function DeviceOrientationEvent() {},
  writable: true,
});

// Mock File APIs
Object.defineProperty(window, "File", {
  value: function File() {},
  writable: true,
});

Object.defineProperty(window, "FileReader", {
  value: function FileReader() {},
  writable: true,
});

Object.defineProperty(window, "FileList", {
  value: function FileList() {},
  writable: true,
});

Object.defineProperty(window, "Blob", {
  value: function Blob() {},
  writable: true,
});

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
    mockNavigator.onLine = true;

    // Reset permission query mock
    mockNavigator.permissions.query.mockResolvedValue({ state: "prompt" });

    // Reset notification permission mock
    mockNotification.requestPermission.mockResolvedValue("granted");
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
    mockNavigator.permissions.query.mockResolvedValue({ state: "granted" });

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Check Camera Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "granted"
      );
    });

    expect(mockNavigator.permissions.query).toHaveBeenCalledWith({
      name: "camera",
    });
  });

  it("requests camera permission successfully", async () => {
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };
    mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Request Camera Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "granted"
      );
    });

    expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: true,
    });
  });

  it("handles camera permission denial", async () => {
    mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error("Permission denied")
    );

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Request Camera Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("camera-permission")).toHaveTextContent(
        "denied"
      );
    });
  });

  it("requests geolocation permission successfully", async () => {
    mockNavigator.geolocation.getCurrentPosition.mockImplementation(
      (success: (position: GeolocationPosition) => void) => {
        success({
          coords: { latitude: 0, longitude: 0 },
        } as GeolocationPosition);
      }
    );

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Request Geolocation Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
        "granted"
      );
    });
  });

  it("handles geolocation permission denial", async () => {
    mockNavigator.geolocation.getCurrentPosition.mockImplementation(
      (
        _success: (position: GeolocationPosition) => void,
        error: (error: GeolocationPositionError) => void
      ) => {
        error({ code: 1 } as GeolocationPositionError); // PERMISSION_DENIED
      }
    );

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Request Geolocation Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("geolocation-permission")).toHaveTextContent(
        "denied"
      );
    });
  });

  it("requests notification permission successfully", async () => {
    mockNotification.requestPermission.mockResolvedValue("granted");

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    await act(async () => {
      screen.getByText("Request Notifications Permission").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("notifications-permission")).toHaveTextContent(
        "granted"
      );
    });

    expect(mockNotification.requestPermission).toHaveBeenCalled();
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
    mockNavigator.permissions.query.mockRejectedValue(
      new Error("Permission API error")
    );
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

  it("detects capabilities correctly when APIs are not available", () => {
    // Remove some APIs
    const originalMediaDevices = mockNavigator.mediaDevices;
    const originalGeolocation = mockNavigator.geolocation;

    // @ts-expect-error - Intentionally deleting for test
    delete mockNavigator.mediaDevices;
    // @ts-expect-error - Intentionally deleting for test
    delete mockNavigator.geolocation;

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>
    );

    expect(screen.getByTestId("camera-capability")).toHaveTextContent("false");
    expect(screen.getByTestId("microphone-capability")).toHaveTextContent(
      "false"
    );
    expect(screen.getByTestId("geolocation-capability")).toHaveTextContent(
      "false"
    );

    // Restore APIs
    mockNavigator.mediaDevices = originalMediaDevices;
    mockNavigator.geolocation = originalGeolocation;
  });
});
