import React, { createContext, useContext, useReducer, useEffect } from "react";
import type {
  DeviceState,
  DeviceAction,
  DevicePermissions,
  PermissionState,
} from "./types";
import { detectDeviceCapabilities } from "./constants";

// Type definitions for browser APIs not in TypeScript
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    addEventListener: (event: string, callback: () => void) => void;
  };
  mozConnection?: {
    effectiveType?: string;
    addEventListener: (event: string, callback: () => void) => void;
  };
  webkitConnection?: {
    effectiveType?: string;
    addEventListener: (event: string, callback: () => void) => void;
  };
}

// Initial permissions state
const initialPermissions: DevicePermissions = {
  camera: "unknown",
  microphone: "unknown",
  geolocation: "unknown",
  notifications: "unknown",
};

// Initial state
const initialState: DeviceState = {
  capabilities: detectDeviceCapabilities(),
  permissions: initialPermissions,
  isOnline: navigator.onLine,
  batteryLevel: undefined,
  networkType: undefined,
};

// Reducer function
const deviceReducer = (
  state: DeviceState,
  action: DeviceAction
): DeviceState => {
  switch (action.type) {
    case "SET_CAPABILITIES":
      return {
        ...state,
        capabilities: action.payload,
      };

    case "UPDATE_PERMISSION":
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [action.payload.permission]: action.payload.state,
        },
      };

    case "SET_ONLINE_STATUS":
      return {
        ...state,
        isOnline: action.payload,
      };

    case "SET_BATTERY_LEVEL":
      return {
        ...state,
        batteryLevel: action.payload,
      };

    case "SET_NETWORK_TYPE":
      return {
        ...state,
        networkType: action.payload,
      };

    default:
      return state;
  }
};

// Context interface
interface DeviceContextType {
  state: DeviceState;
  dispatch: React.Dispatch<DeviceAction>;
  // Helper functions
  checkPermission: (
    permission: keyof DevicePermissions
  ) => Promise<PermissionState>;
  requestPermission: (
    permission: keyof DevicePermissions
  ) => Promise<PermissionState>;
  refreshCapabilities: () => void;
  getBatteryInfo: () => Promise<void>;
  getNetworkInfo: () => void;
}

// Create context
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Provider component
interface DeviceProviderProps {
  children: React.ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(deviceReducer, initialState);

  // Check permission status
  const checkPermission = async (
    permission: keyof DevicePermissions
  ): Promise<PermissionState> => {
    try {
      if (!("permissions" in navigator)) {
        return "unknown";
      }

      let permissionName: PermissionName;
      switch (permission) {
        case "camera":
          permissionName = "camera";
          break;
        case "microphone":
          permissionName = "microphone";
          break;
        case "geolocation":
          permissionName = "geolocation";
          break;
        case "notifications":
          permissionName = "notifications";
          break;
        default:
          return "unknown";
      }

      const result = await navigator.permissions.query({
        name: permissionName,
      });
      const permissionState = result.state as PermissionState;

      dispatch({
        type: "UPDATE_PERMISSION",
        payload: { permission, state: permissionState },
      });

      return permissionState;
    } catch (error) {
      console.warn(`Failed to check ${permission} permission:`, error);
      return "unknown";
    }
  };

  // Request permission
  const requestPermission = async (
    permission: keyof DevicePermissions
  ): Promise<PermissionState> => {
    try {
      let permissionState: PermissionState = "unknown";

      switch (permission) {
        case "camera":
        case "microphone":
          try {
            const constraints =
              permission === "camera" ? { video: true } : { audio: true };
            const stream =
              await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach((track) => track.stop());
            permissionState = "granted";
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            permissionState = "denied";
          }
          break;

        case "geolocation":
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                permissionState = "granted";
                dispatch({
                  type: "UPDATE_PERMISSION",
                  payload: { permission, state: permissionState },
                });
                resolve(permissionState);
              },
              (positionError: GeolocationPositionError) => {
                permissionState =
                  positionError.code === 1 ? "denied" : "unknown";
                dispatch({
                  type: "UPDATE_PERMISSION",
                  payload: { permission, state: permissionState },
                });
                resolve(permissionState);
              }
            );
          });

        case "notifications":
          if ("Notification" in window) {
            const result = await Notification.requestPermission();
            permissionState = result as PermissionState;
          }
          break;

        default:
          permissionState = "unknown";
      }

      dispatch({
        type: "UPDATE_PERMISSION",
        payload: { permission, state: permissionState },
      });

      return permissionState;
    } catch (error) {
      console.warn(`Failed to request ${permission} permission:`, error);
      dispatch({
        type: "UPDATE_PERMISSION",
        payload: { permission, state: "denied" },
      });
      return "denied";
    }
  };

  // Refresh device capabilities
  const refreshCapabilities = () => {
    const capabilities = detectDeviceCapabilities();
    dispatch({ type: "SET_CAPABILITIES", payload: capabilities });
  };

  // Get battery information
  const getBatteryInfo = async () => {
    try {
      if ("getBattery" in navigator) {
        // @ts-expect-error - Battery API is not in TypeScript definitions
        const battery = await navigator.getBattery();
        dispatch({ type: "SET_BATTERY_LEVEL", payload: battery.level * 100 });

        // Listen for battery changes
        battery.addEventListener("levelchange", () => {
          dispatch({ type: "SET_BATTERY_LEVEL", payload: battery.level * 100 });
        });
      }
    } catch (error) {
      console.warn("Failed to get battery info:", error);
    }
  };

  // Get network information
  const getNetworkInfo = () => {
    try {
      if ("connection" in navigator) {
        const connection =
          (navigator as NavigatorWithConnection).connection ||
          (navigator as NavigatorWithConnection).mozConnection ||
          (navigator as NavigatorWithConnection).webkitConnection;
        if (connection) {
          dispatch({
            type: "SET_NETWORK_TYPE",
            payload: connection.effectiveType || "unknown",
          });

          // Listen for network changes
          connection.addEventListener("change", () => {
            dispatch({
              type: "SET_NETWORK_TYPE",
              payload: connection.effectiveType || "unknown",
            });
          });
        }
      }
    } catch (error) {
      console.warn("Failed to get network info:", error);
    }
  };

  // Set up event listeners on mount
  useEffect(() => {
    // Online/offline status
    const handleOnline = () =>
      dispatch({ type: "SET_ONLINE_STATUS", payload: true });
    const handleOffline = () =>
      dispatch({ type: "SET_ONLINE_STATUS", payload: false });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initialize additional device info
    getBatteryInfo();
    getNetworkInfo();

    // Check initial permissions
    const checkInitialPermissions = async () => {
      const permissions: (keyof DevicePermissions)[] = [
        "camera",
        "microphone",
        "geolocation",
        "notifications",
      ];

      for (const permission of permissions) {
        await checkPermission(permission);
      }
    };

    checkInitialPermissions();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const contextValue: DeviceContextType = {
    state,
    dispatch,
    checkPermission,
    requestPermission,
    refreshCapabilities,
    getBatteryInfo,
    getNetworkInfo,
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

// Custom hook to use the DeviceContext
// eslint-disable-next-line react-refresh/only-export-components
export const useDeviceContext = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }
  return context;
};

export default DeviceContext;
