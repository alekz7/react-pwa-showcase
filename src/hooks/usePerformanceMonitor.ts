import { useEffect, useCallback, useState } from "react";
import {
  getPerformanceMonitor,
  PerformanceMetrics,
} from "../utils/performanceMonitor";

export interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  score: number;
  measureRender: (componentName: string) => () => void;
  measureInteraction: (interactionName: string) => () => void;
  logMetrics: () => void;
  exportMetrics: () => string;
  refreshMetrics: () => void;
}

export const usePerformanceMonitor = (): UsePerformanceMonitorReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [score, setScore] = useState<number>(0);

  const refreshMetrics = useCallback(() => {
    const monitor = getPerformanceMonitor();
    const currentMetrics = monitor.getMetrics();
    const currentScore = monitor.getPerformanceScore();

    setMetrics(currentMetrics);
    setScore(currentScore);
  }, []);

  const measureRender = useCallback(
    (componentName: string) => {
      const monitor = getPerformanceMonitor();
      const endMeasurement = monitor.measureRender(componentName);

      return () => {
        endMeasurement();
        refreshMetrics();
      };
    },
    [refreshMetrics]
  );

  const measureInteraction = useCallback(
    (interactionName: string) => {
      const monitor = getPerformanceMonitor();
      const endMeasurement = monitor.measureInteraction(interactionName);

      return () => {
        endMeasurement();
        refreshMetrics();
      };
    },
    [refreshMetrics]
  );

  const logMetrics = useCallback(() => {
    const monitor = getPerformanceMonitor();
    monitor.logMetrics();
  }, []);

  const exportMetrics = useCallback(() => {
    const monitor = getPerformanceMonitor();
    return monitor.exportMetrics();
  }, []);

  // Initialize and refresh metrics on mount
  useEffect(() => {
    refreshMetrics();

    // Refresh metrics periodically
    const interval = setInterval(refreshMetrics, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshMetrics]);

  // Log metrics on page load completion
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        refreshMetrics();
        if (process.env.NODE_ENV === "development") {
          logMetrics();
        }
      }, 1000);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [refreshMetrics, logMetrics]);

  return {
    metrics,
    score,
    measureRender,
    measureInteraction,
    logMetrics,
    exportMetrics,
    refreshMetrics,
  };
};

export default usePerformanceMonitor;
