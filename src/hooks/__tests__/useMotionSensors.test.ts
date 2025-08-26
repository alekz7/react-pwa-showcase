import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMotionSensors } from "../useMotionSensors";

// Mock DeviceMotionEvent and DeviceOrientationEvent
const mockDeviceMotionEvent = {
  accelerationIncludingGravity: {
    x: 1.5,
    y: 2.0,
    z: 9.8,
  },
};

const mockDeviceOrientationEvent = {
  alpha: 45,
  beta: 30,
  gamma: 15,
};

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, "addEventListener", {
  writable: true,
  value: mockAddEventListener,
});

Object.defineProperty(window, "removeEventListener", {
  writable: true,
  value: mockRemoveEventListener,
});

// Mock DeviceMotionEvent and DeviceOrientationEvent constructors
Object.defineProperty(window, "DeviceMotionEvent", {
  writable: true,
  value: function DeviceMotionEvent() {},
});

Object.defineProperty(window, "DeviceOrientationEvent", {
  writable: true,
  value: function DeviceOrientationEvent() {},
});

describe("useMotionSensors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useMotionSensors());

    expect(result.current.motionData).toEqual({
      accelerometer: null,
      gyroscope: null,
      isShaking: false,
      shakeCount: 0,
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true); // DeviceMotionEvent exists in test environment
    expect(result.current.permissionState).toBe("unknown");
    expect(result.current.error).toBe(null);
  });

  describe("requestPermission", () => {
    it("sets permission to granted when no explicit permission needed", async () => {
      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionState).toBe("granted");
      expect(result.current.error).toBe(null);
    });

    it("handles iOS permission request", async () => {
      // Mock iOS-style permission request
      const mockRequestPermission = vi.fn().mockResolvedValue("granted");
      (
        window.DeviceMotionEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission = mockRequestPermission;

      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(result.current.permissionState).toBe("granted");
    });

    it("handles permission denial", async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue("denied");
      (
        window.DeviceMotionEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission = mockRequestPermission;

      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionState).toBe("denied");
      expect(result.current.error).toBe("Motion sensor permission denied");
    });

    it("handles permission request errors", async () => {
      const mockRequestPermission = vi
        .fn()
        .mockRejectedValue(new Error("Permission error"));
      (
        window.DeviceMotionEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission = mockRequestPermission;

      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionState).toBe("denied");
      expect(result.current.error).toBe("Permission error");
    });
  });

  describe("startListening", () => {
    it("starts listening when permission is granted", async () => {
      const { result } = renderHook(() => useMotionSensors());

      // First grant permission
      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "devicemotion",
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "deviceorientation",
        expect.any(Function)
      );
    });

    it("does not start listening without permission", () => {
      const { result } = renderHook(() => useMotionSensors());

      act(() => {
        result.current.startListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBe(
        "Motion sensors not available or permission not granted"
      );
    });
  });

  describe("stopListening", () => {
    it("stops listening and cleans up", async () => {
      const { result } = renderHook(() => useMotionSensors());

      // Start listening first
      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "devicemotion",
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "deviceorientation",
        expect.any(Function)
      );
      expect(result.current.motionData).toEqual({
        accelerometer: null,
        gyroscope: null,
        isShaking: false,
        shakeCount: 0,
      });
    });
  });

  describe("motion data handling", () => {
    it("processes device motion events", async () => {
      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      // Get the event handler that was registered
      const deviceMotionHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "devicemotion"
      )?.[1];

      expect(deviceMotionHandler).toBeDefined();

      // Simulate device motion event
      act(() => {
        deviceMotionHandler(mockDeviceMotionEvent);
      });

      expect(result.current.motionData.accelerometer).toEqual({
        x: 1.5,
        y: 2.0,
        z: 9.8,
        timestamp: expect.any(Number),
      });
    });

    it("processes device orientation events", async () => {
      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      // Get the event handler that was registered
      const deviceOrientationHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "deviceorientation"
      )?.[1];

      expect(deviceOrientationHandler).toBeDefined();

      // Simulate device orientation event
      act(() => {
        deviceOrientationHandler(mockDeviceOrientationEvent);
      });

      expect(result.current.motionData.gyroscope).toEqual({
        alpha: 45,
        beta: 30,
        gamma: 15,
        timestamp: expect.any(Number),
      });
    });
  });

  describe("shake detection", () => {
    it("detects shake gestures", async () => {
      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      const deviceMotionHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "devicemotion"
      )?.[1];

      // First motion event to establish baseline
      act(() => {
        deviceMotionHandler({
          accelerationIncludingGravity: { x: 0, y: 0, z: 9.8 },
        });
      });

      // Second motion event with significant change (shake)
      act(() => {
        deviceMotionHandler({
          accelerationIncludingGravity: { x: 20, y: 20, z: 9.8 },
        });
      });

      expect(result.current.motionData.isShaking).toBe(true);
      expect(result.current.motionData.shakeCount).toBe(1);

      // Fast forward time to clear shake state
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.motionData.isShaking).toBe(false);
    });

    it("resets shake count", async () => {
      const { result } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      const deviceMotionHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "devicemotion"
      )?.[1];

      // Simulate shake
      act(() => {
        deviceMotionHandler({
          accelerationIncludingGravity: { x: 0, y: 0, z: 9.8 },
        });
      });

      act(() => {
        deviceMotionHandler({
          accelerationIncludingGravity: { x: 20, y: 20, z: 9.8 },
        });
      });

      expect(result.current.motionData.shakeCount).toBe(1);

      act(() => {
        result.current.resetShakeCount();
      });

      expect(result.current.motionData.shakeCount).toBe(0);
    });
  });

  describe("error handling", () => {
    it("clears error state", () => {
      const { result } = renderHook(() => useMotionSensors());

      // Set an error first
      act(() => {
        result.current.startListening(); // This should set an error
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("cleanup", () => {
    it("cleans up on unmount", async () => {
      const { result, unmount } = renderHook(() => useMotionSensors());

      await act(async () => {
        await result.current.requestPermission();
      });

      act(() => {
        result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "devicemotion",
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "deviceorientation",
        expect.any(Function)
      );
    });
  });
});
