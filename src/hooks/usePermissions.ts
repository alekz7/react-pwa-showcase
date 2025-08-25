import { useState, useEffect, useCallback } from "react";

export type PermissionName =
  | "camera"
  | "microphone"
  | "geolocation"
  | "notifications"
  | "accelerometer"
  | "gyroscope"
  | "magnetometer";

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface PermissionStatus {
  name: PermissionName;
  state: PermissionState;
  canRequest: boolean;
  isSupported: boolean;
  lastRequested?: Date;
  error?: string;
}

export interface PermissionRequestOptions {
  showRationale?: boolean;
  fallbackMessage?: string;
  onGranted?: () => void;
  onDenied?: () => void;
  onError?: (error: string) => void;
}

interface UsePermissionsReturn {
  permissions: Record<PermissionName, PermissionStatus>;
  requestPermission: (
    name: PermissionName,
    options?: PermissionRequestOptions
  ) => Promise<PermissionState>;
  requestMultiplePermissions: (
    names: PermissionName[],
    options?: PermissionRequestOptions
  ) => Promise<Record<PermissionName, PermissionState>>;
  checkPermission: (name: PermissionName) => Promise<PermissionState>;
  hasPermission: (name: PermissionName) => boolean;
  canUseFeature: (name: PermissionName) => boolean;
  refreshPermissions: () => Promise<void>;
  getPermissionInstructions: (name: PermissionName) => string[];
}

const PERMISSION_API_NAMES: Record<PermissionName, string> = {
  camera: "camera",
  microphone: "microphone",
  geolocation: "geolocation",
  notifications: "notifications",
  accelerometer: "accelerometer",
  gyroscope: "gyroscope",
  magnetometer: "magnetometer",
};

const FEATURE_DETECTION: Record<PermissionName, () => boolean> = {
  camera: () =>
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  microphone: () =>
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  geolocation: () => !!navigator.geolocation,
  notifications: () => "Notification" in window,
  accelerometer: () => "DeviceMotionEvent" in window,
  gyroscope: () => "DeviceOrientationEvent" in window,
  magnetometer: () => "DeviceOrientationEvent" in window,
};

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<
    Record<PermissionName, PermissionStatus>
  >(() => {
    const initialPermissions: Record<PermissionName, PermissionStatus> =
      {} as Record<PermissionName, PermissionStatus>;

    Object.keys(PERMISSION_API_NAMES).forEach((name) => {
      const permissionName = name as PermissionName;
      const isSupported = FEATURE_DETECTION[permissionName]();

      initialPermissions[permissionName] = {
        name: permissionName,
        state: isSupported ? "prompt" : "unsupported",
        canRequest: isSupported,
        isSupported,
      };
    });

    return initialPermissions;
  });

  // Check permission status using the Permissions API
  const checkPermissionAPI = useCallback(
    async (name: PermissionName): Promise<PermissionState> => {
      if (!navigator.permissions) {
        return "unsupported";
      }

      try {
        const result = await navigator.permissions.query({
          name: PERMISSION_API_NAMES[name] as PermissionName,
        } as PermissionDescriptor);
        return result.state as PermissionState;
      } catch (error) {
        console.warn(`Failed to check permission for ${name}:`, error);
        return "unsupported";
      }
    },
    []
  );

  // Check permission using feature-specific APIs
  const checkFeaturePermission = useCallback(
    async (name: PermissionName): Promise<PermissionState> => {
      switch (name) {
        case "notifications":
          if ("Notification" in window) {
            const permission = Notification.permission;
            return permission === "default"
              ? "prompt"
              : (permission as PermissionState);
          }
          return "unsupported";

        case "geolocation":
          // Geolocation doesn't have a direct permission check without requesting
          return "prompt";

        case "camera":
        case "microphone":
          // Media permissions can't be checked without requesting
          return "prompt";

        case "accelerometer":
        case "gyroscope":
        case "magnetometer":
          // Motion sensors require permission on iOS 13+
          if (
            typeof (
              DeviceOrientationEvent as {
                requestPermission?: () => Promise<string>;
              }
            ).requestPermission === "function"
          ) {
            return "prompt";
          }
          return FEATURE_DETECTION[name]() ? "granted" : "unsupported";

        default:
          return "unsupported";
      }
    },
    []
  );

  // Main permission check function
  const checkPermission = useCallback(
    async (name: PermissionName): Promise<PermissionState> => {
      if (!FEATURE_DETECTION[name]()) {
        return "unsupported";
      }

      // Try Permissions API first
      const apiResult = await checkPermissionAPI(name);
      if (apiResult !== "unsupported") {
        return apiResult;
      }

      // Fall back to feature-specific checks
      return await checkFeaturePermission(name);
    },
    [checkPermissionAPI, checkFeaturePermission]
  );

  // Request permission
  const requestPermission = useCallback(
    async (
      name: PermissionName,
      options: PermissionRequestOptions = {}
    ): Promise<PermissionState> => {
      const { onGranted, onDenied, onError } = options;

      if (!FEATURE_DETECTION[name]()) {
        const error = `${name} is not supported on this device`;
        onError?.(error);

        setPermissions((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            state: "unsupported",
            error,
            lastRequested: new Date(),
          },
        }));

        return "unsupported";
      }

      try {
        let result: PermissionState = "denied";

        switch (name) {
          case "notifications":
            if ("Notification" in window) {
              const permission = await Notification.requestPermission();
              result = permission as PermissionState;
            }
            break;

          case "camera":
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              stream.getTracks().forEach((track) => track.stop());
              result = "granted";
            } catch (error: unknown) {
              const err = error as { name?: string };
              result =
                err.name === "NotAllowedError" ? "denied" : "unsupported";
            }
            break;

          case "microphone":
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
              stream.getTracks().forEach((track) => track.stop());
              result = "granted";
            } catch (error: unknown) {
              const err = error as { name?: string };
              result =
                err.name === "NotAllowedError" ? "denied" : "unsupported";
            }
            break;

          case "geolocation":
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                () => {
                  result = "granted";
                  onGranted?.();
                  setPermissions((prev) => ({
                    ...prev,
                    [name]: {
                      ...prev[name],
                      state: result,
                      lastRequested: new Date(),
                    },
                  }));
                  resolve(result);
                },
                (error) => {
                  result =
                    error.code === error.PERMISSION_DENIED
                      ? "denied"
                      : "unsupported";
                  onDenied?.();
                  setPermissions((prev) => ({
                    ...prev,
                    [name]: {
                      ...prev[name],
                      state: result,
                      error: error.message,
                      lastRequested: new Date(),
                    },
                  }));
                  resolve(result);
                },
                { timeout: 10000 }
              );
            });

          case "accelerometer":
          case "gyroscope":
          case "magnetometer":
            if (
              typeof (
                DeviceOrientationEvent as {
                  requestPermission?: () => Promise<string>;
                }
              ).requestPermission === "function"
            ) {
              const permission = await (
                DeviceOrientationEvent as unknown as {
                  requestPermission: () => Promise<string>;
                }
              ).requestPermission();
              result = permission === "granted" ? "granted" : "denied";
            } else {
              result = FEATURE_DETECTION[name]() ? "granted" : "unsupported";
            }
            break;

          default:
            result = "unsupported";
        }

        // Update state
        setPermissions((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            state: result,
            lastRequested: new Date(),
            error: undefined,
          },
        }));

        // Call callbacks
        if (result === "granted") {
          onGranted?.();
        } else if (result === "denied") {
          onDenied?.();
        }

        return result;
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage =
          err.message || `Failed to request ${name} permission`;
        onError?.(errorMessage);

        setPermissions((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            state: "denied",
            error: errorMessage,
            lastRequested: new Date(),
          },
        }));

        return "denied";
      }
    },
    []
  );

  // Request multiple permissions
  const requestMultiplePermissions = useCallback(
    async (
      names: PermissionName[],
      options: PermissionRequestOptions = {}
    ): Promise<Record<PermissionName, PermissionState>> => {
      const results: Record<PermissionName, PermissionState> = {} as Record<
        PermissionName,
        PermissionState
      >;

      for (const name of names) {
        results[name] = await requestPermission(name, options);
      }

      return results;
    },
    [requestPermission]
  );

  // Check if permission is granted
  const hasPermission = useCallback(
    (name: PermissionName): boolean => {
      return permissions[name]?.state === "granted";
    },
    [permissions]
  );

  // Check if feature can be used (supported and granted)
  const canUseFeature = useCallback(
    (name: PermissionName): boolean => {
      const permission = permissions[name];
      return permission?.isSupported && permission?.state === "granted";
    },
    [permissions]
  );

  // Refresh all permissions
  const refreshPermissions = useCallback(async (): Promise<void> => {
    const updates: Partial<Record<PermissionName, PermissionStatus>> = {};

    for (const name of Object.keys(PERMISSION_API_NAMES) as PermissionName[]) {
      const state = await checkPermission(name);
      updates[name] = {
        ...permissions[name],
        state,
      };
    }

    setPermissions((prev) => ({ ...prev, ...updates }));
  }, [checkPermission, permissions]);

  // Get permission instructions for different browsers/devices
  const getPermissionInstructions = useCallback(
    (name: PermissionName): string[] => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isFirefox = /firefox/.test(userAgent);

      const baseInstructions: Record<PermissionName, string[]> = {
        camera: [
          "Click the camera icon in the address bar",
          'Select "Allow" when prompted',
          'If blocked, click the lock icon and change camera permission to "Allow"',
        ],
        microphone: [
          "Click the microphone icon in the address bar",
          'Select "Allow" when prompted',
          'If blocked, click the lock icon and change microphone permission to "Allow"',
        ],
        geolocation: [
          'Click "Allow" when prompted for location access',
          "If blocked, click the location icon in the address bar",
          'Select "Allow" to enable location services',
        ],
        notifications: [
          'Click "Allow" when prompted for notifications',
          "If blocked, click the notification icon in the address bar",
          'Change notification permission to "Allow"',
        ],
        accelerometer: [
          "Motion sensors may require permission on some devices",
          "Allow motion and orientation access when prompted",
          "Check device settings if sensors don't work",
        ],
        gyroscope: [
          "Motion sensors may require permission on some devices",
          "Allow motion and orientation access when prompted",
          "Check device settings if sensors don't work",
        ],
        magnetometer: [
          "Motion sensors may require permission on some devices",
          "Allow motion and orientation access when prompted",
          "Check device settings if sensors don't work",
        ],
      };

      const instructions = [...baseInstructions[name]];

      // Add device-specific instructions
      if (isIOS) {
        if (name === "camera" || name === "microphone") {
          instructions.push(
            "On iOS, go to Settings > Safari > Camera/Microphone if needed"
          );
        }
        if (
          name === "accelerometer" ||
          name === "gyroscope" ||
          name === "magnetometer"
        ) {
          instructions.push(
            "On iOS 13+, motion sensors require explicit permission"
          );
        }
      }

      if (isAndroid) {
        instructions.push(
          "Check Android app permissions in device settings if needed"
        );
      }

      if (isSafari) {
        instructions.push(
          "In Safari, check Preferences > Websites for permission settings"
        );
      }

      if (isFirefox) {
        instructions.push(
          "In Firefox, click the shield icon for permission options"
        );
      }

      return instructions;
    },
    []
  );

  // Initialize permissions on mount
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  return {
    permissions,
    requestPermission,
    requestMultiplePermissions,
    checkPermission,
    hasPermission,
    canUseFeature,
    refreshPermissions,
    getPermissionInstructions,
  };
};

export default usePermissions;
