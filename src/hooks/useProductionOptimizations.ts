import React, { useEffect, useCallback } from "react";
import { reportError, reportPerformance } from "../utils/errorMonitoring";

// Extend Performance interface to include Chrome's memory API
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
  };
}

interface UseProductionOptimizationsOptions {
  enablePerformanceMonitoring?: boolean;
  enableErrorReporting?: boolean;
  performanceThreshold?: number;
}

export const useProductionOptimizations = (
  options: UseProductionOptimizationsOptions = {}
) => {
  const {
    enablePerformanceMonitoring = true,
    enableErrorReporting = true,
    performanceThreshold = 3000, // 3 seconds
  } = options;

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > performanceThreshold) {
        reportError(
          `Slow component render detected: ${renderTime.toFixed(2)}ms`,
          "medium",
          {
            renderTime,
            threshold: performanceThreshold,
            component: "unknown", // Could be enhanced to track component name
          }
        );
      }

      reportPerformance({
        url: window.location.pathname,
        loadTime: renderTime,
        renderTime,
        memoryUsage: (performance as PerformanceWithMemory).memory
          ?.usedJSHeapSize,
      });
    };
  }, [enablePerformanceMonitoring, performanceThreshold]);

  // Error boundary integration
  const reportComponentError = useCallback(
    (error: Error, errorInfo?: { componentStack?: string }) => {
      if (!enableErrorReporting) return;

      reportError(`Component Error: ${error.message}`, "high", {
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.pathname,
      });
    },
    [enableErrorReporting]
  );

  // Network performance monitoring
  const monitorNetworkRequest = useCallback(
    async (url: string, requestPromise: Promise<Response>) => {
      if (!enablePerformanceMonitoring) return requestPromise;

      const startTime = performance.now();

      try {
        const response = await requestPromise;
        const endTime = performance.now();
        const requestTime = endTime - startTime;

        reportPerformance({
          url,
          loadTime: requestTime,
          renderTime: 0,
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const requestTime = endTime - startTime;

        reportError(`Network request failed: ${url}`, "medium", {
          url,
          requestTime,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
      }
    },
    [enablePerformanceMonitoring]
  );

  // Memory leak detection
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const checkMemoryUsage = () => {
      const memory = (performance as PerformanceWithMemory).memory;
      if (!memory) return;

      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (memoryUsage > 0.8) {
        reportError("High memory usage detected", "medium", {
          memoryUsage: memory.usedJSHeapSize,
          memoryLimit: memory.jsHeapSizeLimit,
          percentage: memoryUsage * 100,
          url: window.location.pathname,
        });
      }
    };

    const interval = setInterval(checkMemoryUsage, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enablePerformanceMonitoring]);

  // Resource optimization
  const preloadResource = useCallback(
    (url: string, type: "script" | "style" | "image" | "font") => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = url;
      link.as = type;

      if (type === "font") {
        link.crossOrigin = "anonymous";
      }

      document.head.appendChild(link);

      // Clean up after 10 seconds to avoid memory leaks
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 10000);
    },
    []
  );

  // Lazy loading optimization
  const createIntersectionObserver = useCallback(
    (
      callback: (entries: IntersectionObserverEntry[]) => void,
      options?: IntersectionObserverInit
    ) => {
      if (!("IntersectionObserver" in window)) {
        // Fallback for browsers without IntersectionObserver
        setTimeout(() => callback([]), 100);
        return { disconnect: () => {} };
      }

      return new IntersectionObserver(callback, {
        rootMargin: "50px",
        threshold: 0.1,
        ...options,
      });
    },
    []
  );

  return {
    reportComponentError,
    monitorNetworkRequest,
    preloadResource,
    createIntersectionObserver,
  };
};

// Higher-order component for automatic performance monitoring
export const withProductionOptimizations = <P extends object>(
  Component: React.ComponentType<P>,
  options?: UseProductionOptimizationsOptions
): React.ComponentType<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => {
    useProductionOptimizations(options);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withProductionOptimizations(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
