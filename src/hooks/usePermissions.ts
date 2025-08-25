import { useState, useCallback } from "react";

export type PermissionName =
  | "camera"
  | "microphone"
  | "geolocation"
  | "notifications";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export interface PermissionState {
  status: PermissionStatus;
  error?: string;
  isRequesting: boolean;
}

export interface UsePermissionsReturn {
  permissions: Record<PermissionName, PermissionState>;
  requestPermission: (permission: PermissionName) => Promise<PermissionStatus>;
  checkPermission: (permission: PermissionName) => Promise<PermissionStatus>;
  hasPermission: (permission: PermissionName) => boolean;
  isRequesting: (permission: PermissionName) => boolean;
}

const initialPermissionState: PermissionState = {
  status: "unknown",
  isRequesting: false,
};

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<
    Record<PermissionName, PermissionState>
  >({
    camera: { ...initialPermissionState },
    microphone: { ...initialPermissionState },
    geolocation: { ...initialPermissionState },
    notifications: { ...initialPermissionState },
  });

  const updatePermissionState = useCallback(
    (permission: PermissionName, updates: Partial<PermissionState>) => {
      setPermissions((prev) => ({
        ...prev,
        [permission]: { ...prev[permission], ...updates },
      }));
    },
    []
  );

  const checkPermission = useCallback(
    async (permission: PermissionName): Promise<PermissionStatus> => {
      try {
        switch (permission) {
          case "camera":
          case "microphone": {
            if (!navigator.mediaDevices?.getUserMedia) {
              updatePermissionState(permission, {
                status: "denied",
                error: "Media devices not supported",
              });
              return "denied";
            }

            // Check if we can query permissions
            if ("permissions" in navigator) {
              const permissionName =
                permission === "camera" ? "camera" : "microphone";
              const result = await navigator.permissions.query({
                name: permissionName as PermissionName,
              });
              const status = result.state as PermissionStatus;
              updatePermissionState(permission, { status });
              return status;
            }

            // Fallback: assume prompt if we can't check
            updatePermissionState(permission, { status: "prompt" });
            return "prompt";
          }

          case "geolocation": {
            if (!navigator.geolocation) {
              updatePermissionState(permission, {
                status: "denied",
                error: "Geolocation not supported",
              });
              return "denied";
            }

            if ("permissions" in navigator) {
              const result = await navigator.permissions.query({
                name: "geolocation",
              });
              const status = result.state as PermissionStatus;
              updatePermissionState(permission, { status });
              return status;
            }

            updatePermissionState(permission, { status: "prompt" });
            return "prompt";
          }

          case "notifications": {
            if (!("Notification" in window)) {
              updatePermissionState(permission, {
                status: "denied",
                error: "Notifications not supported",
              });
              return "denied";
            }

            const status = Notification.permission as PermissionStatus;
            updatePermissionState(permission, { status });
            return status;
          }

          default:
            updatePermissionState(permission, {
              status: "unknown",
              error: "Unknown permission type",
            });
            return "unknown";
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Permission check failed";
        updatePermissionState(permission, {
          status: "unknown",
          error: errorMessage,
        });
        return "unknown";
      }
    },
    [updatePermissionState]
  );

  const requestPermission = useCallback(
    async (permission: PermissionName): Promise<PermissionStatus> => {
      updatePermissionState(permission, {
        isRequesting: true,
        error: undefined,
      });

      try {
        switch (permission) {
          case "camera": {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            stream.getTracks().forEach((track) => track.stop()); // Clean up
            updatePermissionState(permission, {
              status: "granted",
              isRequesting: false,
            });
            return "granted";
          }

          case "microphone": {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((track) => track.stop()); // Clean up
            updatePermissionState(permission, {
              status: "granted",
              isRequesting: false,
            });
            return "granted";
          }

          case "geolocation": {
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                () => {
                  updatePermissionState(permission, {
                    status: "granted",
                    isRequesting: false,
                  });
                  resolve("granted");
                },
                (error) => {
                  const status =
                    error.code === error.PERMISSION_DENIED
                      ? "denied"
                      : "unknown";
                  updatePermissionState(permission, {
                    status,
                    isRequesting: false,
                    error: error.message,
                  });
                  resolve(status);
                },
                { timeout: 10000 }
              );
            });
          }

          case "notifications": {
            const result = await Notification.requestPermission();
            const status = result as PermissionStatus;
            updatePermissionState(permission, { status, isRequesting: false });
            return status;
          }

          default:
            updatePermissionState(permission, {
              status: "unknown",
              isRequesting: false,
              error: "Unknown permission type",
            });
            return "unknown";
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Permission request failed";
        updatePermissionState(permission, {
          status: "denied",
          isRequesting: false,
          error: errorMessage,
        });
        return "denied";
      }
    },
    [updatePermissionState]
  );

  const hasPermission = useCallback(
    (permission: PermissionName): boolean => {
      return permissions[permission].status === "granted";
    },
    [permissions]
  );

  const isRequesting = useCallback(
    (permission: PermissionName): boolean => {
      return permissions[permission].isRequesting;
    },
    [permissions]
  );

  return {
    permissions,
    requestPermission,
    checkPermission,
    hasPermission,
    isRequesting,
  };
};
