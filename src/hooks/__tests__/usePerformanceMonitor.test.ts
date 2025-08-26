import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePerformanceMonitor } from "../usePerformanceMonitor";
import * as performanceMonitorModule from "../../utils/performanceMonitor";

// Mock the performance monitor
const mockPerformanceMonitor = {
  getMetrics: vi.fn(),
  getPerformanceScore: vi.fn(),
  measureRender: vi.fn(),
  measureInteraction: vi.fn(),
  logMetrics: vi.fn(),
  exportMetrics: vi.fn(),
};

vi.mock("../../utils/performanceMonitor", () => ({
  getPerformanceMonitor: vi.fn(() => mockPerformanceMonitor),
}));

describe("usePerformanceMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockPerformanceMonitor.getMetrics.mockReturnValue({
      loadTime: 1500,
      lcp: 2000,
      fid: 50,
      cls: 0.1,
      memoryUsage: {
        used: 1024 * 1024,
        total: 2048 * 1024,
        limit: 4096 * 1024,
      },
    });

    mockPerformanceMonitor.getPerformanceScore.mockReturnValue(85);
    mockPerformanceMonitor.exportMetrics.mockReturnValue(
      JSON.stringify({ test: "data" })
    );
    mockPerformanceMonitor.measureRender.mockReturnValue(vi.fn());
    mockPerformanceMonitor.measureInteraction.mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("initializes with performance metrics", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      expect(result.current.metrics).toEqual({
        loadTime: 1500,
        lcp: 2000,
        fid: 50,
        cls: 0.1,
        memoryUsage: {
          used: 1024 * 1024,
          total: 2048 * 1024,
          limit: 4096 * 1024,
        },
      });

      expect(result.current.score).toBe(85);
    });

    it("calls getPerformanceMonitor on mount", () => {
      renderHook(() => usePerformanceMonitor());

      expect(performanceMonitorModule.getPerformanceMonitor).toHaveBeenCalled();
    });
  });

  describe("metric refresh", () => {
    it("refreshes metrics when refreshMetrics is called", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // Update mock return values
      mockPerformanceMonitor.getMetrics.mockReturnValue({
        loadTime: 2000,
        lcp: 2500,
      });
      mockPerformanceMonitor.getPerformanceScore.mockReturnValue(75);

      act(() => {
        result.current.refreshMetrics();
      });

      expect(result.current.metrics.loadTime).toBe(2000);
      expect(result.current.metrics.lcp).toBe(2500);
      expect(result.current.score).toBe(75);
    });
  });

  describe("measurement functions", () => {
    it("provides measureRender function", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const endMeasurement = result.current.measureRender("TestComponent");

      expect(mockPerformanceMonitor.measureRender).toHaveBeenCalledWith(
        "TestComponent"
      );
      expect(typeof endMeasurement).toBe("function");
    });

    it("provides measureInteraction function", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const endMeasurement = result.current.measureInteraction("click");

      expect(mockPerformanceMonitor.measureInteraction).toHaveBeenCalledWith(
        "click"
      );
      expect(typeof endMeasurement).toBe("function");
    });

    it("refreshes metrics after measurement ends", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const endMeasurement = result.current.measureRender("TestComponent");

      act(() => {
        endMeasurement();
      });

      // Should call getMetrics again after measurement
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledTimes(2); // Once on mount, once after measurement
    });
  });

  describe("utility functions", () => {
    it("provides logMetrics function", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      result.current.logMetrics();

      expect(mockPerformanceMonitor.logMetrics).toHaveBeenCalled();
    });

    it("provides exportMetrics function", () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const exported = result.current.exportMetrics();

      expect(mockPerformanceMonitor.exportMetrics).toHaveBeenCalled();
      expect(exported).toBe('{"test":"data"}');
    });
  });

  describe("periodic updates", () => {
    it("sets up periodic metric refresh", () => {
      vi.useFakeTimers();

      renderHook(() => usePerformanceMonitor());

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should have called getMetrics multiple times (initial + periodic)
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("cleans up interval on unmount", () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() => usePerformanceMonitor());

      unmount();

      // Fast-forward time after unmount
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not call getMetrics after unmount
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("load event handling", () => {
    it("handles page load completion", () => {
      // Mock document.readyState
      Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
      });

      renderHook(() => usePerformanceMonitor());

      // Should call getMetrics on load
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalled();
    });

    it("sets up load event listener when not complete", () => {
      // Mock document.readyState as loading
      Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
      });

      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      renderHook(() => usePerformanceMonitor());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "load",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe("development mode logging", () => {
    it("logs metrics in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      // Mock document.readyState as complete to trigger immediate load handling
      Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
      });

      vi.useFakeTimers();

      renderHook(() => usePerformanceMonitor());

      // Fast-forward past the setTimeout delay
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockPerformanceMonitor.logMetrics).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      vi.useRealTimers();
    });
  });

  describe("error handling", () => {
    it("handles errors in metric collection gracefully", () => {
      mockPerformanceMonitor.getMetrics.mockImplementation(() => {
        throw new Error("Metrics collection failed");
      });

      expect(() => {
        renderHook(() => usePerformanceMonitor());
      }).not.toThrow();
    });

    it("handles errors in measurement functions gracefully", () => {
      mockPerformanceMonitor.measureRender.mockImplementation(() => {
        throw new Error("Measurement failed");
      });

      const { result } = renderHook(() => usePerformanceMonitor());

      expect(() => {
        result.current.measureRender("TestComponent");
      }).not.toThrow();
    });
  });
});
