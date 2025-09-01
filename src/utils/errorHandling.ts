/**
 * Error handling utilities for the PWA Showcase application
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  userMessage: string;
  suggestions: string[];
}

export const ErrorCode = {
  // Permission Errors
  PERMISSION_DENIED: "PERMISSION_DENIED",
  PERMISSION_UNAVAILABLE: "PERMISSION_UNAVAILABLE",

  // API Errors
  API_NOT_SUPPORTED: "API_NOT_SUPPORTED",
  API_UNAVAILABLE: "API_UNAVAILABLE",
  API_TIMEOUT: "API_TIMEOUT",

  // Network Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  OFFLINE: "OFFLINE",

  // Device Errors
  DEVICE_NOT_SUPPORTED: "DEVICE_NOT_SUPPORTED",
  HARDWARE_UNAVAILABLE: "HARDWARE_UNAVAILABLE",

  // Generic Errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INITIALIZATION_ERROR: "INITIALIZATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Creates a standardized error object with user-friendly messages and recovery suggestions
 */
export function createAppError(
  code: ErrorCode,
  originalError?: Error,
  customMessage?: string
): AppError {
  const errorMap: Record<ErrorCode, Omit<AppError, "code">> = {
    [ErrorCode.PERMISSION_DENIED]: {
      message: "Permission denied by user",
      userMessage:
        customMessage ||
        "Permission was denied. Please allow access to use this feature.",
      recoverable: true,
      suggestions: [
        "Click the permission icon in your browser's address bar",
        "Go to browser settings and enable permissions for this site",
        "Refresh the page and try again",
      ],
    },
    [ErrorCode.PERMISSION_UNAVAILABLE]: {
      message: "Permission API not available",
      userMessage:
        customMessage || "Permission system is not available in this browser.",
      recoverable: false,
      suggestions: [
        "Try using a modern browser like Chrome, Firefox, or Safari",
        "Update your browser to the latest version",
      ],
    },
    [ErrorCode.API_NOT_SUPPORTED]: {
      message: "API not supported in this browser",
      userMessage:
        customMessage ||
        "This feature is not supported in your current browser.",
      recoverable: false,
      suggestions: [
        "Try using a modern browser with better API support",
        "Update your browser to the latest version",
        "Check browser compatibility information",
      ],
    },
    [ErrorCode.API_UNAVAILABLE]: {
      message: "API temporarily unavailable",
      userMessage: customMessage || "This feature is temporarily unavailable.",
      recoverable: true,
      suggestions: [
        "Try again in a few moments",
        "Check your internet connection",
        "Refresh the page",
      ],
    },
    [ErrorCode.API_TIMEOUT]: {
      message: "API request timed out",
      userMessage: customMessage || "The request took too long to complete.",
      recoverable: true,
      suggestions: [
        "Check your internet connection",
        "Try again with a better connection",
        "Refresh the page and retry",
      ],
    },
    [ErrorCode.NETWORK_ERROR]: {
      message: "Network connection error",
      userMessage: customMessage || "Unable to connect to the network.",
      recoverable: true,
      suggestions: [
        "Check your internet connection",
        "Try connecting to a different network",
        "Refresh the page when connection is restored",
      ],
    },
    [ErrorCode.OFFLINE]: {
      message: "Application is offline",
      userMessage:
        customMessage ||
        "You are currently offline. Some features may not be available.",
      recoverable: true,
      suggestions: [
        "Connect to the internet to access all features",
        "Some features may work offline with cached data",
      ],
    },
    [ErrorCode.DEVICE_NOT_SUPPORTED]: {
      message: "Device not supported",
      userMessage:
        customMessage || "This feature is not supported on your device.",
      recoverable: false,
      suggestions: [
        "Try using a different device",
        "Check if your device supports this feature",
      ],
    },
    [ErrorCode.HARDWARE_UNAVAILABLE]: {
      message: "Required hardware not available",
      userMessage:
        customMessage ||
        "The required hardware is not available or accessible.",
      recoverable: false,
      suggestions: [
        "Make sure the required hardware is connected",
        "Check device permissions and settings",
        "Try using a device with the required hardware",
      ],
    },
    [ErrorCode.INITIALIZATION_ERROR]: {
      message: "Failed to initialize feature",
      userMessage: customMessage || "Failed to initialize this feature.",
      recoverable: true,
      suggestions: [
        "Refresh the page and try again",
        "Check browser console for more details",
        "Try using a different browser",
      ],
    },
    [ErrorCode.UNKNOWN_ERROR]: {
      message: "An unknown error occurred",
      userMessage: customMessage || "An unexpected error occurred.",
      recoverable: true,
      suggestions: [
        "Refresh the page and try again",
        "Check browser console for more details",
        "Try using a different browser",
      ],
    },
  };

  const errorInfo = errorMap[code];

  return {
    code,
    ...errorInfo,
    details: originalError?.message || originalError?.stack,
  };
}

/**
 * Handles permission-related errors with specific messaging
 */
export function handlePermissionError(
  error: Error,
  featureName: string
): AppError {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("denied") || errorMessage.includes("permission")) {
    return createAppError(
      ErrorCode.PERMISSION_DENIED,
      error,
      `${featureName} permission was denied. Please allow access to use this feature.`
    );
  }

  if (
    errorMessage.includes("not supported") ||
    errorMessage.includes("unavailable")
  ) {
    return createAppError(
      ErrorCode.API_NOT_SUPPORTED,
      error,
      `${featureName} is not supported in this browser.`
    );
  }

  return createAppError(ErrorCode.UNKNOWN_ERROR, error);
}

/**
 * Handles API-related errors with appropriate categorization
 */
export function handleApiError(error: Error, apiName: string): AppError {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("timeout")) {
    return createAppError(
      ErrorCode.API_TIMEOUT,
      error,
      `${apiName} request timed out. Please try again.`
    );
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return createAppError(
      ErrorCode.NETWORK_ERROR,
      error,
      `Network error while accessing ${apiName}.`
    );
  }

  if (errorMessage.includes("not supported")) {
    return createAppError(
      ErrorCode.API_NOT_SUPPORTED,
      error,
      `${apiName} is not supported in this browser.`
    );
  }

  return createAppError(
    ErrorCode.API_UNAVAILABLE,
    error,
    `${apiName} is currently unavailable.`
  );
}

/**
 * Checks if a feature is supported in the current browser
 */
export function checkFeatureSupport(feature: string): {
  supported: boolean;
  reason?: string;
} {
  const checks: Record<string, () => boolean> = {
    camera: () =>
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    microphone: () =>
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    geolocation: () => !!navigator.geolocation,
    deviceMotion: () => "DeviceMotionEvent" in window,
    deviceOrientation: () => "DeviceOrientationEvent" in window,
    serviceWorker: () => "serviceWorker" in navigator,
    notifications: () => "Notification" in window,
    fileSystem: () => "File" in window && "FileReader" in window,
    webSocket: () => "WebSocket" in window,
    localStorage: () => {
      try {
        return "localStorage" in window && window.localStorage !== null;
      } catch {
        return false;
      }
    },
  };

  const check = checks[feature.toLowerCase()];
  if (!check) {
    return { supported: false, reason: "Unknown feature" };
  }

  const supported = check();
  return {
    supported,
    reason: supported
      ? undefined
      : `${feature} is not supported in this browser`,
  };
}

/**
 * Provides graceful degradation suggestions for unsupported features
 */
export function getGracefulDegradation(feature: string): {
  alternatives: string[];
  fallbackMessage: string;
} {
  const degradationMap: Record<
    string,
    { alternatives: string[]; fallbackMessage: string }
  > = {
    camera: {
      alternatives: [
        "Use file input to upload photos instead",
        "Try the demo on a mobile device",
        "Use a browser that supports camera access",
      ],
      fallbackMessage:
        "Camera access is not available, but you can still explore other features.",
    },
    microphone: {
      alternatives: [
        "Use file input to upload audio files",
        "Try the demo on a device with microphone support",
        "Explore other audio-related features",
      ],
      fallbackMessage:
        "Microphone access is not available, but other features are still accessible.",
    },
    geolocation: {
      alternatives: [
        "Manually enter coordinates",
        "Use the map without location tracking",
        "Try on a device with GPS support",
      ],
      fallbackMessage:
        "Location services are not available, but you can still use the map features.",
    },
    deviceMotion: {
      alternatives: [
        "Use mouse or touch to simulate motion",
        "Try on a mobile device with motion sensors",
        "Explore other interactive features",
      ],
      fallbackMessage:
        "Motion sensors are not available, but you can still interact with the demo.",
    },
    notifications: {
      alternatives: [
        "Check for updates manually",
        "Use browser notifications if available",
        "Enable notifications in browser settings",
      ],
      fallbackMessage:
        "Push notifications are not available, but the app will still work normally.",
    },
  };

  return (
    degradationMap[feature.toLowerCase()] || {
      alternatives: [
        "Try using a different browser",
        "Check browser compatibility",
      ],
      fallbackMessage:
        "This feature is not available, but other features are still accessible.",
    }
  );
}

/**
 * Logs errors with appropriate detail level based on environment
 */
export function logError(error: AppError | Error, context?: string): void {
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    console.group(`🚨 Error${context ? ` in ${context}` : ""}`);
    console.error("Error details:", error);
    if ("suggestions" in error) {
      console.info("Suggestions:", error.suggestions);
    }
    console.groupEnd();
  } else {
    // In production, you might want to send to an error reporting service
    console.error(
      "Application error:",
      error instanceof Error ? error.message : error.userMessage
    );
  }
}

/**
 * Creates a retry mechanism with exponential backoff
 */
export function createRetryMechanism<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attempt = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          reject(
            createAppError(
              ErrorCode.API_UNAVAILABLE,
              error as Error,
              `Operation failed after ${maxRetries} attempts`
            )
          );
          return;
        }

        const delay = baseDelay * Math.pow(2, retryCount - 1);
        setTimeout(attempt, delay);
      }
    };

    attempt();
  });
}
