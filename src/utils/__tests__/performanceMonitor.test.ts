import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import PerformanceMonitor, {
  getPerformanceMonitor,
} from "../performanceMonitor";

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: { getEntries: () => any[] }) => void;

  constructor(callback: (list: { getEntries: () => any[] }) => void) {
    this.callback = callback;
  }

  observe() {
    // Mock observe
  }

  disconnect() {
    // Mock disconnect
  }

  simulateEntries(entries: any[]) {
    this.callback({ getEntries: () => entries });
  }
}

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  timing: {
    navigationStart: 0,
    loadEventEnd: 2000,
    domContentLoadedEventEnd: 1500,
  },
  getEntriesByType: vi.fn(() => [
    { transferSize: 1024 },
    { transferSize: 2048 },
  ]),
  memory: {
    usedJSHeapSize: 1024 * 1024,
    totalJSHeapSize: 2048 * 1024,
    jsHeapSizeLimit: 4096 * 1024,
  },
};

// Mock window
const mockWindow = {
  performance: mockPerformance,
  PerformanceObserver: MockPerformanceObserver,
  location: { href: "https://example.com" },
};

const mockNavigator = {
  userAgent: "Test User Agent",
};

describe("PerformanceMonitor", () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, "window", {
      value: mockWindow,
      writable: true,
    });

    Object.defineProperty(global, "navigator", {
      value: mockNavigator,
      writable: true,
    });

    Object.defineProperty(global, "performance", {
      value: mockPerformance,
      writable: true,
    });

    vi.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.destroy();
    }
  });

  describe("initialization", () => {
    it("creates performance monitor successfully", () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it("collects initial metrics", () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveProperty("loadTime");
      expect(metrics).toHaveProperty("resourceCount");
      expect(metrics).toHaveProperty("totalResourceSize");
      expect(metrics).toHaveProperty("memoryUsage");
    });
  });

  describe("function measurement", () => {
    it("measures function execution time", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = performanceMonitor.measureFunction("test-function", () => {
        return "test-result";
      });

      expect(result).toBe("test-result");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test-function took")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("render measurement", () => {
    it("measures component render time", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const endMeasurement = performanceMonitor.measureRender("TestComponent");
      endMeasurement();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("TestComponent render took")
      );

      consoleSpy.mockRestore();
    });

    it("updates render time metric", () => {
      const endMeasurement = performanceMonitor.measureRender("TestComponent");
      endMeasurement();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.renderTime).toBeGreaterThan(0);
    });
  });

  describe("interaction measurement", () => {
    it("measures interaction response time", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const endMeasurement = performanceMonitor.measureInteraction("click");
      endMeasurement();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("click interaction took")
      );

      consoleSpy.mockRestore();
    });

    it("updates interaction time metric", () => {
      const endMeasurement = performanceMonitor.measureInteraction("click");
      endMeasurement();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.interactionTime).toBeGreaterThan(0);
    });
  });

  describe("metrics collection", () => {
    it("gets current metrics", () => {
      const metrics = performanceMonitor.getMetrics();

      expect(metrics).toHaveProperty("loadTime");
      expect(metrics).toHaveProperty("resourceCount");
      expect(metrics).toHaveProperty("totalResourceSize");
      expect(metrics).toHaveProperty("memoryUsage");

      expect(metrics.loadTime).toBe(2000);
      expect(metrics.resourceCount).toBe(2);
      expect(metrics.totalResourceSize).toBe(3072);
    });

    it("updates memory usage", () => {
      const metrics = performanceMonitor.getMetrics();

      expect(metrics.memoryUsage).toEqual({
        used: 1024 * 1024,
        total: 2048 * 1024,
        limit: 4096 * 1024,
      });
    });
  });

  describe("performance score", () => {
    it("calculates performance score", () => {
      const score = performanceMonitor.getPerformanceScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("returns lower score for poor metrics", () => {
      // Simulate poor LCP
      const metrics = performanceMonitor.getMetrics();
      (performanceMonitor as any).metrics.lcp = 5000; // Poor LCP

      const score = performanceMonitor.getPerformanceScore();
      expect(score).toBeLessThan(100);
    });
  });

  describe("logging and export", () => {
    it("logs metrics to console", () => {
      const consoleSpy = vi
        .spyOn(console, "group")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleGroupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});

      performanceMonitor.logMetrics();

      expect(consoleSpy).toHaveBeenCalledWith("🚀 Performance Metrics");
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it("exports metrics as JSON", () => {
      const exported = performanceMonitor.exportMetrics();
      const data = JSON.parse(exported);

      expect(data).toHaveProperty("loadTime");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("userAgent");
      expect(data).toHaveProperty("url");
    });
  });

  describe("cleanup", () => {
    it("destroys observers on cleanup", () => {
      const destroySpy = vi.spyOn(performanceMonitor, "destroy");

      performanceMonitor.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe("singleton pattern", () => {
    it("returns same instance from getPerformanceMonitor", () => {
      const instance1 = getPerformanceMonitor();
      const instance2 = getPerformanceMonitor();

      expect(instance1).toBe(instance2);
    });
  });

  describe("error handling", () => {
    it("handles missing PerformanceObserver gracefully", () => {
      delete (global as any).PerformanceObserver;

      expect(() => {
        const monitor = new PerformanceMonitor();
        monitor.destroy();
      }).not.toThrow();
    });

    it("handles missing performance API gracefully", () => {
      delete (global as any).performance;

      expect(() => {
        const monitor = new PerformanceMonitor();
        monitor.destroy();
      }).not.toThrow();
    });
  });
});
