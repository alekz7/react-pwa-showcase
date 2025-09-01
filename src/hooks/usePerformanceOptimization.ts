import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  prefetchRouteResources,
  performanceReporter,
  preloadModules,
} from "../utils/performanceOptimizations";
import { getPerformanceMonitor } from "../utils/performanceMonitor";

/**
 * Hook for performance optimization and monitoring
 */
export function usePerformanceOptimization() {
  const location = useLocation();
  const performanceMonitor = getPerformanceMonitor();

  // Prefetch likely next routes based on current route
  const prefetchNextRoutes = useCallback(() => {
    const routeMap: Record<string, string[]> = {
      "/": ["/camera", "/microphone", "/files"], // From home, likely to visit demos
      "/camera": ["/microphone", "/files"], // Related demos
      "/microphone": ["/camera", "/motion"], // Related demos
      "/files": ["/camera", "/location"], // Related demos
      "/motion": ["/location", "/realtime"], // Related demos
      "/location": ["/motion", "/realtime"], // Related demos
      "/realtime": ["/pwa"], // Final demo
    };

    const nextRoutes = routeMap[location.pathname] || [];
    nextRoutes.forEach((route) => {
      prefetchRouteResources(route);
    });
  }, [location.pathname]);

  // Preload critical modules for the current route
  const preloadCriticalModules = useCallback(() => {
    const moduleMap: Record<string, string[]> = {
      "/camera": ["./src/pages/CameraDemo.tsx"],
      "/microphone": ["./src/pages/MicrophoneDemo.tsx"],
      "/files": ["./src/pages/FileSystemDemo.tsx"],
      "/motion": ["./src/pages/MotionSensorsDemo.tsx"],
      "/location": ["./src/pages/LocationDemo.tsx"],
      "/realtime": ["./src/components/demos/RealtimeDemo.tsx"],
      "/pwa": ["./src/components/demos/PWAFeaturesDemo.tsx"],
    };

    const modules = moduleMap[location.pathname] || [];
    if (modules.length > 0) {
      preloadModules(modules);
    }
  }, [location.pathname]);

  // Monitor route change performance
  useEffect(() => {
    performanceReporter.markStart(`route-${location.pathname}`);

    // Cleanup function to mark route end
    return () => {
      performanceReporter.markEnd(`route-${location.pathname}`);
    };
  }, [location.pathname]);

  // Prefetch and preload on route change
  useEffect(() => {
    // Small delay to avoid blocking the main thread
    const timeoutId = setTimeout(() => {
      prefetchNextRoutes();
      preloadCriticalModules();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [prefetchNextRoutes, preloadCriticalModules]);

  // Monitor component render performance
  const measureRender = useCallback(
    (componentName: string) => {
      return performanceMonitor.measureRender(componentName);
    },
    [performanceMonitor]
  );

  // Monitor interaction performance
  const measureInteraction = useCallback(
    (interactionName: string) => {
      return performanceMonitor.measureInteraction(interactionName);
    },
    [performanceMonitor]
  );

  // Get current performance metrics
  const getMetrics = useCallback(() => {
    return {
      performanceMonitor: performanceMonitor.getMetrics(),
      customMetrics: performanceReporter.getMetrics(),
    };
  }, [performanceMonitor]);

  // Report all performance data
  const reportPerformance = useCallback(() => {
    const metrics = getMetrics();

    if (process.env.NODE_ENV === "development") {
      console.group("Performance Report");
      console.table(metrics.performanceMonitor);
      console.table(metrics.customMetrics);
      console.groupEnd();
    }

    return metrics;
  }, [getMetrics]);

  return {
    measureRender,
    measureInteraction,
    getMetrics,
    reportPerformance,
    prefetchNextRoutes,
    preloadCriticalModules,
  };
}
