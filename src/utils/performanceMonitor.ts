/**
 * Performance monitoring utilities for analyzing bundle size and runtime performance
 */

export interface PerformanceMetrics {
  // Bundle Analysis
  bundleSize?: number;
  chunkSizes?: Record<string, number>;

  // Runtime Performance
  loadTime?: number;
  renderTime?: number;
  interactionTime?: number;

  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift

  // Memory Usage
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };

  // Network
  resourceCount?: number;
  totalResourceSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.collectInitialMetrics();
  }

  private initializeObservers(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number;
        };
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(
          (
            entry: PerformanceEntry & {
              processingStart: number;
              startTime: number;
            }
          ) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        );
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(
          (
            entry: PerformanceEntry & { value: number; hadRecentInput: boolean }
          ) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        );
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn("Performance monitoring not fully supported:", error);
    }
  }

  private collectInitialMetrics(): void {
    if (typeof window === "undefined") return;

    // Collect navigation timing
    if (window.performance?.timing) {
      const timing = window.performance.timing;
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    }

    // Collect resource timing
    if (window.performance?.getEntriesByType) {
      const resources = window.performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      this.metrics.resourceCount = resources.length;
      this.metrics.totalResourceSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    }

    // Collect memory usage (Chrome only)
    const performanceWithMemory = window.performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (performanceWithMemory.memory) {
      const memory = performanceWithMemory.memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
  }

  /**
   * Measure the time it takes to execute a function
   */
  public measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }

  /**
   * Measure component render time
   */
  public measureRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`${componentName} render took ${renderTime} milliseconds`);

      if (!this.metrics.renderTime || renderTime > this.metrics.renderTime) {
        this.metrics.renderTime = renderTime;
      }
    };
  }

  /**
   * Measure interaction response time
   */
  public measureInteraction(interactionName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      console.log(
        `${interactionName} interaction took ${interactionTime} milliseconds`
      );

      if (
        !this.metrics.interactionTime ||
        interactionTime > this.metrics.interactionTime
      ) {
        this.metrics.interactionTime = interactionTime;
      }
    };
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    // Update memory usage if available
    const performanceWithMemory = window.performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (performanceWithMemory.memory) {
      const memory = performanceWithMemory.memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }

    return { ...this.metrics };
  }

  /**
   * Log performance metrics to console
   */
  public logMetrics(): void {
    const metrics = this.getMetrics();

    console.group("🚀 Performance Metrics");

    if (metrics.loadTime) {
      console.log(`⏱️ Load Time: ${metrics.loadTime.toFixed(2)}ms`);
    }

    if (metrics.lcp) {
      console.log(`🎨 Largest Contentful Paint: ${metrics.lcp.toFixed(2)}ms`);
    }

    if (metrics.fid) {
      console.log(`👆 First Input Delay: ${metrics.fid.toFixed(2)}ms`);
    }

    if (metrics.cls) {
      console.log(`📐 Cumulative Layout Shift: ${metrics.cls.toFixed(4)}`);
    }

    if (metrics.renderTime) {
      console.log(`🔄 Longest Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.interactionTime) {
      console.log(
        `🖱️ Longest Interaction Time: ${metrics.interactionTime.toFixed(2)}ms`
      );
    }

    if (metrics.memoryUsage) {
      const { used, total, limit } = metrics.memoryUsage;
      console.log(
        `💾 Memory Usage: ${(used / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB (Limit: ${(limit / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    if (metrics.resourceCount && metrics.totalResourceSize) {
      console.log(
        `📦 Resources: ${metrics.resourceCount} files, ${(metrics.totalResourceSize / 1024).toFixed(2)}KB total`
      );
    }

    console.groupEnd();
  }

  /**
   * Export metrics as JSON
   */
  public exportMetrics(): string {
    return JSON.stringify(
      {
        ...this.getMetrics(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      null,
      2
    );
  }

  /**
   * Get performance score (0-100)
   */
  public getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Deduct points for poor Core Web Vitals
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }

    if (metrics.fid) {
      if (metrics.fid > 300) score -= 30;
      else if (metrics.fid > 100) score -= 15;
    }

    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 30;
      else if (metrics.cls > 0.1) score -= 15;
    }

    // Deduct points for slow load time
    if (metrics.loadTime) {
      if (metrics.loadTime > 5000) score -= 20;
      else if (metrics.loadTime > 3000) score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Clean up observers
   */
  public destroy(): void {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn("Error disconnecting performance observer:", error);
      }
    });
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

export const logPerformanceMetrics = (): void => {
  getPerformanceMonitor().logMetrics();
};

export const measureComponentRender = (componentName: string) => {
  return getPerformanceMonitor().measureRender(componentName);
};

export const measureUserInteraction = (interactionName: string) => {
  return getPerformanceMonitor().measureInteraction(interactionName);
};

export default PerformanceMonitor;
