import { useState, useEffect, useCallback } from "react";

interface OfflineState {
  isOnline: boolean;
  isOfflineReady: boolean;
  lastOnline: Date | null;
  connectionType: string | null;
}

interface UseOfflineReturn extends OfflineState {
  checkConnection: () => Promise<boolean>;
  getCachedData: (key: string) => unknown;
  setCachedData: (key: string, data: unknown) => void;
  clearCache: () => void;
  getCacheSize: () => Promise<number>;
}

export const useOffline = (): UseOfflineReturn => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOfflineReady: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionType: null,
  });

  // Check if we have a service worker and cache available
  useEffect(() => {
    const checkOfflineReady = async () => {
      if ("serviceWorker" in navigator && "caches" in window) {
        try {
          const cacheNames = await caches.keys();
          const hasCache = cacheNames.length > 0;
          setState((prev) => ({ ...prev, isOfflineReady: hasCache }));
        } catch (error) {
          console.warn("Failed to check cache availability:", error);
        }
      }
    };

    checkOfflineReady();
  }, []);

  // Get connection type if available
  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection =
        (
          navigator as {
            connection?: { effectiveType?: string; type?: string };
          }
        ).connection ||
        (
          navigator as {
            mozConnection?: { effectiveType?: string; type?: string };
          }
        ).mozConnection ||
        (
          navigator as {
            webkitConnection?: { effectiveType?: string; type?: string };
          }
        ).webkitConnection;

      if (connection) {
        setState((prev) => ({
          ...prev,
          connectionType: connection.effectiveType || connection.type || null,
        }));
      }
    };

    updateConnectionInfo();

    // Listen for connection changes
    const connection = (
      navigator as {
        connection?: {
          addEventListener?: (event: string, handler: () => void) => void;
          removeEventListener?: (event: string, handler: () => void) => void;
        };
      }
    ).connection;
    if (
      connection &&
      connection.addEventListener &&
      connection.removeEventListener
    ) {
      connection.addEventListener("change", updateConnectionInfo);
      return () =>
        connection.removeEventListener!("change", updateConnectionInfo);
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check connection with actual network request
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/react-pwa-showcase/manifest.json", {
        method: "HEAD",
        cache: "no-cache",
      });
      const isOnline = response.ok;

      setState((prev) => ({
        ...prev,
        isOnline,
        lastOnline: isOnline ? new Date() : prev.lastOnline,
      }));

      return isOnline;
    } catch {
      setState((prev) => ({ ...prev, isOnline: false }));
      return false;
    }
  }, []);

  // Cache management functions
  const getCachedData = useCallback((key: string): unknown => {
    try {
      const cached = localStorage.getItem(`pwa_cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached data:", error);
      return null;
    }
  }, []);

  const setCachedData = useCallback((key: string, data: unknown): void => {
    try {
      localStorage.setItem(
        `pwa_cache_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn("Failed to cache data:", error);
    }
  }, []);

  const clearCache = useCallback((): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("pwa_cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }, []);

  const getCacheSize = useCallback(async (): Promise<number> => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();

          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
        }

        return totalSize;
      } catch (error) {
        console.warn("Failed to calculate cache size:", error);
        return 0;
      }
    }
    return 0;
  }, []);

  return {
    ...state,
    checkConnection,
    getCachedData,
    setCachedData,
    clearCache,
    getCacheSize,
  };
};

export default useOffline;
