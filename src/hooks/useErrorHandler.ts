import { useState, useCallback } from "react";
import { useAppContext } from "../context";
import {
  ErrorCode,
  createAppError,
  handlePermissionError,
  handleApiError,
  logError,
} from "../utils/errorHandling";
import type { AppError } from "../utils/errorHandling";

interface UseErrorHandlerReturn {
  error: AppError | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: Error | AppError, context?: string) => void;
  handlePermissionError: (error: Error, featureName: string) => void;
  handleApiError: (error: Error, apiName: string) => void;
  retry: (operation: () => Promise<void> | void) => Promise<void>;
}

/**
 * Custom hook for centralized error handling with user notifications
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const { addNotification } = useAppContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (error: Error | AppError, context?: string) => {
      let appError: AppError;

      if ("code" in error) {
        // Already an AppError
        appError = error;
      } else {
        // Convert Error to AppError
        appError = createAppError(ErrorCode.UNKNOWN_ERROR, error);
      }

      setError(appError);
      logError(appError, context);

      // Show user notification
      addNotification({
        type: "error",
        message: appError.userMessage,
        autoHide: !appError.recoverable, // Keep non-recoverable errors visible
      });
    },
    [addNotification]
  );

  const handlePermissionErrorCallback = useCallback(
    (error: Error, featureName: string) => {
      const appError = handlePermissionError(error, featureName);
      handleError(appError, `${featureName} Permission`);
    },
    [handleError]
  );

  const handleApiErrorCallback = useCallback(
    (error: Error, apiName: string) => {
      const appError = handleApiError(error, apiName);
      handleError(appError, `${apiName} API`);
    },
    [handleError]
  );

  const retry = useCallback(
    async (operation: () => Promise<void> | void) => {
      try {
        clearError();
        await operation();

        // Show success notification if error was cleared
        addNotification({
          type: "success",
          message: "Operation completed successfully!",
          autoHide: true,
        });
      } catch (error) {
        handleError(error as Error, "Retry Operation");
      }
    },
    [clearError, handleError, addNotification]
  );

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    handlePermissionError: handlePermissionErrorCallback,
    handleApiError: handleApiErrorCallback,
    retry,
  };
}

/**
 * Hook for handling async operations with automatic error handling
 */
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { handleError } = useErrorHandler();

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        setLoading(true);
        const result = await operation();
        setData(result);
        return result;
      } catch (error) {
        handleError(error as Error, context);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
  }, []);

  return {
    loading,
    data,
    execute,
    reset,
  };
}

/**
 * Hook for handling feature support checks with graceful degradation
 */
export function useFeatureSupport(featureName: string) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [supportMessage, setSupportMessage] = useState<string>("");
  const { handleError } = useErrorHandler();

  const checkSupport = useCallback(async () => {
    try {
      // Dynamic import to avoid loading all checks upfront
      const { checkFeatureSupport, getGracefulDegradation } = await import(
        "../utils/errorHandling"
      );

      const support = checkFeatureSupport(featureName);
      setIsSupported(support.supported);

      if (!support.supported) {
        const degradation = getGracefulDegradation(featureName);
        setSupportMessage(degradation.fallbackMessage);

        // Create a non-recoverable error for unsupported features
        const error = createAppError(
          ErrorCode.API_NOT_SUPPORTED,
          undefined,
          `${featureName} is not supported in this browser`
        );
        handleError(error, `${featureName} Support Check`);
      } else {
        setSupportMessage("");
      }
    } catch (error) {
      handleError(error as Error, `${featureName} Support Check`);
      setIsSupported(false);
    }
  }, [featureName, handleError]);

  return {
    isSupported,
    supportMessage,
    checkSupport,
  };
}
