import React from "react";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";

/**
 * Component to initialize performance optimizations within Router context
 */
const PerformanceInitializer: React.FC = () => {
  // Initialize performance optimizations
  usePerformanceOptimization();

  // This component doesn't render anything
  return null;
};

export default PerformanceInitializer;
