import React, { useEffect } from "react";
import type { ComponentType } from "react";
import { measureComponentRender } from "../utils/performanceMonitor";

interface WithPerformanceMonitoringOptions {
  componentName?: string;
  logRenderTime?: boolean;
  measureInteractions?: boolean;
}

/**
 * Higher-order component that adds performance monitoring to any component
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPerformanceMonitoringOptions = {}
) {
  const {
    componentName = WrappedComponent.displayName ||
      WrappedComponent.name ||
      "Component",
    logRenderTime = true,
    measureInteractions = false,
  } = options;

  const WithPerformanceMonitoringComponent: React.FC<P> = (props) => {
    useEffect(() => {
      if (logRenderTime) {
        const endMeasurement = measureComponentRender(componentName);

        // Measure initial render
        const timeoutId = setTimeout(() => {
          endMeasurement();
        }, 0);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, []);

    // Add interaction monitoring if enabled
    const enhancedProps = measureInteractions
      ? {
          ...props,
          onClick: (event: React.MouseEvent) => {
            const endMeasurement = measureComponentRender(
              `${componentName} Click`
            );

            if ("onClick" in props && typeof props.onClick === "function") {
              props.onClick(event);
            }

            setTimeout(endMeasurement, 0);
          },
        }
      : props;

    return <WrappedComponent {...enhancedProps} />;
  };

  WithPerformanceMonitoringComponent.displayName = `withPerformanceMonitoring(${componentName})`;

  return WithPerformanceMonitoringComponent;
}

/**
 * Decorator for class components
 */
export function performanceMonitored(
  options?: WithPerformanceMonitoringOptions
) {
  return function <P extends object>(target: ComponentType<P>) {
    return withPerformanceMonitoring(target, options);
  };
}

export default withPerformanceMonitoring;
