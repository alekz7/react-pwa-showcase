import React, { useEffect, useRef } from "react";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";

interface PerformanceOptimizerProps {
  componentName: string;
  children: React.ReactNode;
  enableMeasurement?: boolean;
}

/**
 * HOC component that wraps children with performance monitoring
 */
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  componentName,
  children,
  enableMeasurement = true,
}) => {
  const { measureRender } = usePerformanceOptimization();
  const renderMeasurement = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (enableMeasurement) {
      // Start measuring render time
      renderMeasurement.current = measureRender(componentName);
    }

    // Cleanup measurement on unmount
    return () => {
      if (renderMeasurement.current) {
        renderMeasurement.current();
      }
    };
  }, [componentName, enableMeasurement, measureRender]);

  return <>{children}</>;
};

export default PerformanceOptimizer;
