import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { usePermissions } from "../usePermissions";

// Mock navigator APIs
const mockGetUserMedia = vi.fn();
const mockPermissionsQuery = vi.fn();
const mockGeolocationGetCurrentPosition = vi.fn();
const mockNotificationRequestPermission = vi.fn();

// Create mock Notification constructor
const createMockNotification = (permission = "default") => ({
  permission,
  requestPermission: mockNotificationRequestPermission,
});

// Setup function to restore mocks
const setupMocks = () => {
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global.navigator, "permissions", {
    value: {
      query: mockPermissionsQuery,
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global.navigator, "geolocation", {
    value: {
      getCurrentPosition: mockGeolocationGetCurrentPosition,
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global.window, "Notification", {
    value: createMockNotification(),
    writable: true,
    configurable: true,
  });
};

describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with unknown permissions", () => {
    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissions.camera.status).toBe("unknown");
    expect(result.current.permissions.microphone.status).toBe("unknown");
    expect(result.current.permissions.geolocation.status).toBe("unknown");
    expect(result.current.permissions.notifications.status).toBe("unknown");
  });

  describe("checkPermission", () => {
    it("checks camera permission successfully", async () => {
      mockPermissionsQuery.mockResolvedValue({ state: "granted" });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("camera");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.camera.status).toBe("granted");
      expect(mockPermissionsQuery).toHaveBeenCalledWith({ name: "camera" });
    });

    it("checks microphone permission successfully", async () => {
      mockPermissionsQuery.mockResolvedValue({ state: "prompt" });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("microphone");
        expect(status).toBe("prompt");
      });

      expect(result.current.permissions.microphone.status).toBe("prompt");
      expect(mockPermissionsQuery).toHaveBeenCalledWith({ name: "microphone" });
    });

    it("checks geolocation permission successfully", async () => {
      mockPermissionsQuery.mockResolvedValue({ state: "denied" });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("geolocation");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.geolocation.status).toBe("denied");
      expect(mockPermissionsQuery).toHaveBeenCalledWith({
        name: "geolocation",
      });
    });

    it("checks notification permission successfully", async () => {
      Object.defineProperty(global.window, "Notification", {
        value: createMockNotification("granted"),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("notifications");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.notifications.status).toBe("granted");
    });

    it("handles unsupported camera", async () => {
      // Remove mediaDevices support
      Object.defineProperty(global.navigator, "mediaDevices", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("camera");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.camera.status).toBe("denied");
      expect(result.current.permissions.camera.error).toBe(
        "Media devices not supported"
      );
    });

    it("handles unsupported geolocation", async () => {
      // Remove geolocation support
      Object.defineProperty(global.navigator, "geolocation", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("geolocation");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.geolocation.status).toBe("denied");
      expect(result.current.permissions.geolocation.error).toBe(
        "Geolocation not supported"
      );
    });

    it("handles unsupported notifications", async () => {
      // Remove Notification support by deleting the property
      delete (global.window as unknown as Record<string, unknown>).Notification;

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.checkPermission("notifications");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.notifications.status).toBe("denied");
      expect(result.current.permissions.notifications.error).toBe(
        "Notifications not supported"
      );

      // Restore for other tests
      setupMocks();
    });
  });

  describe("requestPermission", () => {
    it("requests camera permission successfully", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("camera");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.camera.status).toBe("granted");
      expect(result.current.permissions.camera.isRequesting).toBe(false);
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
    });

    it("requests microphone permission successfully", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("microphone");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.microphone.status).toBe("granted");
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it("requests geolocation permission successfully", async () => {
      mockGeolocationGetCurrentPosition.mockImplementation(
        (successCallback) => {
          setTimeout(
            () => successCallback({ coords: { latitude: 0, longitude: 0 } }),
            0
          );
        }
      );

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("geolocation");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.geolocation.status).toBe("granted");
    });

    it("requests notification permission successfully", async () => {
      mockNotificationRequestPermission.mockResolvedValue("granted");

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("notifications");
        expect(status).toBe("granted");
      });

      expect(result.current.permissions.notifications.status).toBe("granted");
      expect(mockNotificationRequestPermission).toHaveBeenCalled();
    });

    it("handles camera permission denial", async () => {
      mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("camera");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.camera.status).toBe("denied");
      expect(result.current.permissions.camera.error).toBe("Permission denied");
    });

    it("handles geolocation permission denial", async () => {
      mockGeolocationGetCurrentPosition.mockImplementation(
        (_successCallback, errorCallback) => {
          setTimeout(
            () =>
              errorCallback!({
                code: 1,
                message: "Permission denied",
                PERMISSION_DENIED: 1,
              }),
            0
          );
        }
      );

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        const status = await result.current.requestPermission("geolocation");
        expect(status).toBe("denied");
      });

      expect(result.current.permissions.geolocation.status).toBe("denied");
      expect(result.current.permissions.geolocation.error).toBe(
        "Permission denied"
      );
    });

    it("sets isRequesting flag during request", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetUserMedia.mockReturnValue(promise);

      const { result } = renderHook(() => usePermissions());

      act(() => {
        result.current.requestPermission("camera");
      });

      expect(result.current.permissions.camera.isRequesting).toBe(true);

      await act(async () => {
        resolvePromise!({
          getTracks: () => [{ stop: vi.fn() }],
        });
        await promise;
      });

      expect(result.current.permissions.camera.isRequesting).toBe(false);
    });
  });

  describe("utility methods", () => {
    it("hasPermission returns correct status", async () => {
      const { result } = renderHook(() => usePermissions());

      // Initially false
      expect(result.current.hasPermission("camera")).toBe(false);

      // Grant permission through proper flow
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await act(async () => {
        await result.current.requestPermission("camera");
      });

      expect(result.current.hasPermission("camera")).toBe(true);
    });

    it("isRequesting returns correct status", async () => {
      const { result } = renderHook(() => usePermissions());

      // Initially false
      expect(result.current.isRequesting("camera")).toBe(false);

      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetUserMedia.mockReturnValue(promise);

      // Start request
      act(() => {
        result.current.requestPermission("camera");
      });

      // Should be requesting now
      expect(result.current.isRequesting("camera")).toBe(true);

      // Complete the request
      await act(async () => {
        resolvePromise!({
          getTracks: () => [{ stop: vi.fn() }],
        });
        await promise;
      });

      // Should not be requesting anymore
      expect(result.current.isRequesting("camera")).toBe(false);
    });
  });
});
