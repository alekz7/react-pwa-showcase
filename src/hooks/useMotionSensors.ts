import { useState, useEffect, useCallback, useRef } from "react";

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface GyroscopeData {
  alpha: number; // Z axis
  beta: number; // X axis
  gamma: number; // Y axis
  timestamp: number;
}

export interface MotionData {
  accelerometer: AccelerometerData | null;
  gyroscope: GyroscopeData | null;
  isShaking: boolean;
  shakeCount: number;
}

// Type definitions for iOS 13+ permission API
interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export interface UseMotionSensorsReturn {
  // State
  motionData: MotionData;
  isListening: boolean;
  isSupported: boolean;
  permissionState: "granted" | "denied" | "prompt" | "unknown";
  error: string | null;

  // Actions
  requestPermission: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  resetShakeCount: () => void;
  clearError: () => void;
}

export const useMotionSensors = (): UseMotionSensorsReturn => {
  const [motionData, setMotionData] = useState<MotionData>({
    accelerometer: null,
    gyroscope: null,
    isShaking: false,
    shakeCount: 0,
  });
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [error, setError] = useState<string | null>(null);

  // Refs for shake detection
  const lastAcceleration = useRef<AccelerometerData | null>(null);
  const shakeThreshold = useRef(15); // Threshold for shake detection
  const shakeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if motion sensors are supported
  useEffect(() => {
    const checkSupport = () => {
      const hasDeviceMotion = "DeviceMotionEvent" in window;
      const hasDeviceOrientation = "DeviceOrientationEvent" in window;
      setIsSupported(hasDeviceMotion || hasDeviceOrientation);
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);

    try {
      // For iOS 13+ devices, we need to request permission
      const DeviceMotionEventTyped =
        DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
      const DeviceOrientationEventTyped =
        DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;

      if (typeof DeviceMotionEventTyped.requestPermission === "function") {
        const permission = await DeviceMotionEventTyped.requestPermission();
        if (permission === "granted") {
          setPermissionState("granted");
        } else {
          setPermissionState("denied");
          setError("Motion sensor permission denied");
        }
      } else if (
        typeof DeviceOrientationEventTyped.requestPermission === "function"
      ) {
        const permission =
          await DeviceOrientationEventTyped.requestPermission();
        if (permission === "granted") {
          setPermissionState("granted");
        } else {
          setPermissionState("denied");
          setError("Device orientation permission denied");
        }
      } else {
        // For other browsers, assume permission is granted if supported
        setPermissionState(isSupported ? "granted" : "denied");
        if (!isSupported) {
          setError("Motion sensors are not supported on this device");
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to request motion sensor permission";
      setError(errorMessage);
      setPermissionState("denied");
    }
  }, [isSupported]);

  const detectShake = useCallback((acceleration: AccelerometerData) => {
    if (!lastAcceleration.current) {
      lastAcceleration.current = acceleration;
      return;
    }

    const deltaX = Math.abs(acceleration.x - lastAcceleration.current.x);
    const deltaY = Math.abs(acceleration.y - lastAcceleration.current.y);
    const deltaZ = Math.abs(acceleration.z - lastAcceleration.current.z);

    const totalDelta = deltaX + deltaY + deltaZ;

    if (totalDelta > shakeThreshold.current) {
      setMotionData((prev) => ({
        ...prev,
        isShaking: true,
        shakeCount: prev.shakeCount + 1,
      }));

      // Clear shake state after a short delay
      if (shakeTimeout.current) {
        clearTimeout(shakeTimeout.current);
      }
      shakeTimeout.current = setTimeout(() => {
        setMotionData((prev) => ({
          ...prev,
          isShaking: false,
        }));
      }, 500);
    }

    lastAcceleration.current = acceleration;
  }, []);

  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (
        acceleration &&
        acceleration.x !== null &&
        acceleration.y !== null &&
        acceleration.z !== null
      ) {
        const accelerometerData: AccelerometerData = {
          x: acceleration.x,
          y: acceleration.y,
          z: acceleration.z,
          timestamp: Date.now(),
        };

        setMotionData((prev) => ({
          ...prev,
          accelerometer: accelerometerData,
        }));

        detectShake(accelerometerData);
      }
    },
    [detectShake]
  );

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const gyroscopeData: GyroscopeData = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
          timestamp: Date.now(),
        };

        setMotionData((prev) => ({
          ...prev,
          gyroscope: gyroscopeData,
        }));
      }
    },
    []
  );

  const startListening = useCallback(() => {
    if (!isSupported || permissionState !== "granted") {
      setError("Motion sensors not available or permission not granted");
      return;
    }

    setError(null);
    setIsListening(true);

    // Add event listeners
    window.addEventListener("devicemotion", handleDeviceMotion);
    window.addEventListener("deviceorientation", handleDeviceOrientation);
  }, [
    isSupported,
    permissionState,
    handleDeviceMotion,
    handleDeviceOrientation,
  ]);

  const stopListening = useCallback(() => {
    setIsListening(false);

    // Remove event listeners
    window.removeEventListener("devicemotion", handleDeviceMotion);
    window.removeEventListener("deviceorientation", handleDeviceOrientation);

    // Clear shake timeout
    if (shakeTimeout.current) {
      clearTimeout(shakeTimeout.current);
      shakeTimeout.current = null;
    }

    // Reset motion data
    setMotionData({
      accelerometer: null,
      gyroscope: null,
      isShaking: false,
      shakeCount: 0,
    });
  }, [handleDeviceMotion, handleDeviceOrientation]);

  const resetShakeCount = useCallback(() => {
    setMotionData((prev) => ({
      ...prev,
      shakeCount: 0,
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    // State
    motionData,
    isListening,
    isSupported,
    permissionState,
    error,

    // Actions
    requestPermission,
    startListening,
    stopListening,
    resetShakeCount,
    clearError,
  };
};
