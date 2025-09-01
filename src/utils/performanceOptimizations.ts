/**
 * Performance optimization utilities for React PWA Showcase
 * Provides runtime performance enhancements and monitoring
 */

/**
 * Preload critical resources to improve loading performance
 */
export function preloadCriticalResources(): void {
  // Preload critical fonts
  const fontPreloads = [
    "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  ];

  fontPreloads.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    link.onload = () => {
      link.rel = "stylesheet";
    };
    document.head.appendChild(link);
  });
}

/**
 * Optimize images with lazy loading and WebP support
 */
export function optimizeImages(): void {
  // Add intersection observer for lazy loading images
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove("lazy");
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Prefetch next route resources based on user interaction
 */
export function prefetchRouteResources(routePath: string): void {
  // Create a link element for prefetching
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = routePath;
  document.head.appendChild(link);
}

/**
 * Optimize third-party scripts loading
 */
export function optimizeThirdPartyScripts(): void {
  // Defer non-critical scripts
  const scripts = document.querySelectorAll("script[data-defer]");
  scripts.forEach((script) => {
    const newScript = document.createElement("script");
    newScript.src = (script as HTMLScriptElement).src;
    newScript.defer = true;
    document.head.appendChild(newScript);
  });
}

/**
 * Enable resource hints for better performance
 */
export function enableResourceHints(): void {
  // DNS prefetch for external domains
  const domains = ["fonts.googleapis.com", "fonts.gstatic.com"];

  domains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

/**
 * Optimize bundle loading with module preloading
 */
export function preloadModules(modules: string[]): void {
  modules.forEach((modulePath) => {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = modulePath;
    document.head.appendChild(link);
  });
}

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations(): void {
  // Run optimizations when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      preloadCriticalResources();
      optimizeImages();
      optimizeThirdPartyScripts();
      enableResourceHints();
    });
  } else {
    preloadCriticalResources();
    optimizeImages();
    optimizeThirdPartyScripts();
    enableResourceHints();
  }
}

/**
 * Performance monitoring and reporting
 */
export class PerformanceReporter {
  private metrics: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  markEnd(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name, "measure")[0];
    const duration = measure.duration;

    this.metrics.set(name, duration);
    return duration;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Report metrics to console (development) or analytics (production)
   */
  report(): void {
    const metrics = this.getMetrics();

    if (import.meta.env.DEV) {
      console.table(metrics);
    } else {
      // In production, send to analytics service
      // Example: analytics.track('performance_metrics', metrics);
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Export singleton instance
export const performanceReporter = new PerformanceReporter();
