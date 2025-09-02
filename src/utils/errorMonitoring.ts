/**
 * Production-ready error monitoring and reporting system
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  buildVersion: string;
  errorType: "javascript" | "unhandledRejection" | "network" | "custom";
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, unknown>;
}

export interface PerformanceReport {
  url: string;
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  timestamp: string;
  userAgent: string;
  connectionType?: string;
}

class ErrorMonitor {
  private sessionId: string;
  private buildVersion: string;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceReport[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
    this.initializeErrorHandlers();
    this.initializePerformanceMonitoring();
    this.initializeNetworkMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    // Global JavaScript errors
    window.addEventListener("error", (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        errorType: "javascript",
        severity: "high",
        context: {
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        errorType: "unhandledRejection",
        severity: "medium",
        context: {
          reason: event.reason,
        },
      });
    });
  }

  private initializePerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.reportPerformance({
            url: window.location.href,
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            renderTime:
              navigation.domContentLoadedEventEnd - navigation.fetchStart,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            connectionType: (
              navigator as Navigator & {
                connection?: { effectiveType: string };
              }
            ).connection?.effectiveType,
          });
        }
      }, 1000);
    });

    // Monitor memory usage (Chrome only)
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
          }
        ).memory;
        if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.reportError({
            message: "High memory usage detected",
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            buildVersion: this.buildVersion,
            errorType: "custom",
            severity: "medium",
            context: {
              memoryUsage: memory.usedJSHeapSize,
              memoryLimit: memory.jsHeapSizeLimit,
              percentage:
                (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            },
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.reportError({
            message: `Network error: ${response.status} ${response.statusText}`,
            url:
              typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            buildVersion: this.buildVersion,
            errorType: "network",
            severity: response.status >= 500 ? "high" : "medium",
            context: {
              status: response.status,
              statusText: response.statusText,
              requestUrl:
                typeof args[0] === "string"
                  ? args[0]
                  : (args[0] as Request).url,
            },
          });
        }
        return response;
      } catch (error) {
        this.reportError({
          message: `Fetch error: ${error instanceof Error ? error.message : "Unknown error"}`,
          stack: error instanceof Error ? error.stack : undefined,
          url: typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          buildVersion: this.buildVersion,
          errorType: "network",
          severity: "high",
          context: {
            requestUrl:
              typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
          },
        });
        throw error;
      }
    };
  }

  public reportError(error: ErrorReport): void {
    // Add to queue
    this.errorQueue.push(error);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("Error reported:", error);
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }

    // Store in localStorage as backup
    this.storeInLocalStorage("errorQueue", this.errorQueue);
  }

  public reportPerformance(performance: PerformanceReport): void {
    // Add to queue
    this.performanceQueue.push(performance);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("Performance reported:", performance);
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }

    // Store in localStorage as backup
    this.storeInLocalStorage("performanceQueue", this.performanceQueue);
  }

  public reportCustomError(
    message: string,
    severity: ErrorReport["severity"] = "medium",
    context?: Record<string, unknown>
  ): void {
    this.reportError({
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      errorType: "custom",
      severity,
      context,
    });
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline) return;

    // Send errors
    if (this.errorQueue.length > 0) {
      try {
        await this.sendErrors([...this.errorQueue]);
        this.errorQueue = [];
        localStorage.removeItem("errorQueue");
      } catch (error) {
        console.warn("Failed to send error reports:", error);
      }
    }

    // Send performance data
    if (this.performanceQueue.length > 0) {
      try {
        await this.sendPerformanceData([...this.performanceQueue]);
        this.performanceQueue = [];
        localStorage.removeItem("performanceQueue");
      } catch (error) {
        console.warn("Failed to send performance reports:", error);
      }
    }
  }

  private async sendErrors(errors: ErrorReport[]): Promise<void> {
    // In a real application, you would send this to your error tracking service
    // For demo purposes, we'll just log it
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors }),
      // });

      console.log("Would send errors to tracking service:", errors);
    }
  }

  private async sendPerformanceData(data: PerformanceReport[]): Promise<void> {
    // In a real application, you would send this to your analytics service
    // For demo purposes, we'll just log it
    if (import.meta.env.PROD) {
      // Example: Send to analytics service
      // await fetch('/api/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ data }),
      // });

      console.log("Would send performance data to analytics service:", data);
    }
  }

  private storeInLocalStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to store data in localStorage:", error);
    }
  }

  private loadFromLocalStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn("Failed to load data from localStorage:", error);
      return [];
    }
  }

  public initialize(): void {
    // Load any queued data from localStorage
    this.errorQueue = this.loadFromLocalStorage<ErrorReport>("errorQueue");
    this.performanceQueue =
      this.loadFromLocalStorage<PerformanceReport>("performanceQueue");

    // Try to flush queues on initialization
    if (this.isOnline) {
      this.flushQueues();
    }
  }

  public getSessionInfo(): { sessionId: string; buildVersion: string } {
    return {
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
    };
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor();

// Initialize error monitoring
errorMonitor.initialize();

// Export convenience functions
export const reportError = (
  message: string,
  severity: ErrorReport["severity"] = "medium",
  context?: Record<string, unknown>
) => errorMonitor.reportCustomError(message, severity, context);

export const reportPerformance = (
  data: Omit<PerformanceReport, "timestamp" | "userAgent">
) =>
  errorMonitor.reportPerformance({
    ...data,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
