import { describe, it, expect, beforeEach, vi } from "vitest";
import BundleAnalyzer, {
  getBundleAnalyzer,
  trackChunkLoad,
  trackModuleLoad,
} from "../bundleAnalyzer";

describe("BundleAnalyzer", () => {
  let bundleAnalyzer: BundleAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    bundleAnalyzer = new BundleAnalyzer();
  });

  describe("chunk tracking", () => {
    it("tracks chunk loading", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      bundleAnalyzer.trackChunkLoad("main", 1024);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Chunk loaded: main")
      );

      consoleSpy.mockRestore();
    });

    it("tracks chunk loading without size", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      bundleAnalyzer.trackChunkLoad("vendor");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Chunk loaded: vendor")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("module tracking", () => {
    it("tracks module loading", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      bundleAnalyzer.trackModuleLoad("react");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Module loaded: react")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("analysis generation", () => {
    it("generates bundle analysis", () => {
      bundleAnalyzer.trackChunkLoad("main", 1024);
      bundleAnalyzer.trackChunkLoad("vendor", 2048);

      const analysis = bundleAnalyzer.getAnalysis();

      expect(analysis).toHaveProperty("totalSize");
      expect(analysis).toHaveProperty("chunks");
      expect(analysis).toHaveProperty("largestChunks");
      expect(analysis).toHaveProperty("recommendations");

      expect(analysis.totalSize).toBe(3072);
      expect(analysis.chunks).toHaveLength(2);
    });

    it("sorts largest chunks correctly", () => {
      bundleAnalyzer.trackChunkLoad("small", 512);
      bundleAnalyzer.trackChunkLoad("large", 2048);
      bundleAnalyzer.trackChunkLoad("medium", 1024);

      const analysis = bundleAnalyzer.getAnalysis();

      expect(analysis.largestChunks[0].chunkName).toBe("large");
      expect(analysis.largestChunks[1].chunkName).toBe("medium");
      expect(analysis.largestChunks[2].chunkName).toBe("small");
    });
  });

  describe("recommendations", () => {
    it("recommends splitting large chunks", () => {
      bundleAnalyzer.trackChunkLoad("huge-chunk", 600 * 1024); // 600KB

      const analysis = bundleAnalyzer.getAnalysis();

      expect(analysis.recommendations).toContain(
        expect.stringContaining("Consider splitting large chunks")
      );
    });

    it("recommends reducing total bundle size", () => {
      bundleAnalyzer.trackChunkLoad("chunk1", 1024 * 1024); // 1MB
      bundleAnalyzer.trackChunkLoad("chunk2", 1024 * 1024); // 1MB
      bundleAnalyzer.trackChunkLoad("chunk3", 1024 * 1024); // 1MB

      const analysis = bundleAnalyzer.getAnalysis();

      expect(analysis.recommendations).toContain(
        expect.stringContaining("Total bundle size is large")
      );
    });

    it("recommends chunk merging for many small chunks", () => {
      // Create 25 small chunks
      for (let i = 0; i < 25; i++) {
        bundleAnalyzer.trackChunkLoad(`chunk-${i}`, 1024);
      }

      const analysis = bundleAnalyzer.getAnalysis();

      expect(analysis.recommendations).toContain(
        expect.stringContaining("Many small chunks detected")
      );
    });
  });

  describe("logging", () => {
    it("logs bundle analysis", () => {
      const consoleSpy = vi
        .spyOn(console, "group")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleGroupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});

      bundleAnalyzer.trackChunkLoad("test", 1024);
      bundleAnalyzer.logAnalysis();

      expect(consoleSpy).toHaveBeenCalledWith("📊 Bundle Analysis");
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe("export functionality", () => {
    it("exports analysis as JSON", () => {
      bundleAnalyzer.trackChunkLoad("test", 1024);

      const exported = bundleAnalyzer.exportAnalysis();
      const data = JSON.parse(exported);

      expect(data).toHaveProperty("totalSize");
      expect(data).toHaveProperty("chunks");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("userAgent");
    });
  });

  describe("performance recommendations", () => {
    it("provides performance recommendations", () => {
      bundleAnalyzer.trackChunkLoad("large", 2 * 1024 * 1024); // 2MB

      const recommendations = bundleAnalyzer.getPerformanceRecommendations();

      expect(recommendations).toContain(
        expect.stringContaining("Bundle size is over 1MB")
      );
    });

    it("recommends more chunks for better caching", () => {
      bundleAnalyzer.trackChunkLoad("main", 1024);
      bundleAnalyzer.trackChunkLoad("vendor", 2048);

      const recommendations = bundleAnalyzer.getPerformanceRecommendations();

      expect(recommendations).toContain(
        expect.stringContaining(
          "Consider splitting your bundle into more chunks"
        )
      );
    });

    it("recommends lazy loading for many modules", () => {
      // Track many modules
      for (let i = 0; i < 150; i++) {
        bundleAnalyzer.trackModuleLoad(`module-${i}`);
      }

      const recommendations = bundleAnalyzer.getPerformanceRecommendations();

      expect(recommendations).toContain(
        expect.stringContaining("Consider lazy loading non-critical modules")
      );
    });
  });

  describe("singleton pattern", () => {
    it("returns same instance from getBundleAnalyzer", () => {
      const instance1 = getBundleAnalyzer();
      const instance2 = getBundleAnalyzer();

      expect(instance1).toBe(instance2);
    });
  });

  describe("utility functions", () => {
    it("tracks chunk load via utility function", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      trackChunkLoad("utility-chunk", 1024);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Chunk loaded: utility-chunk")
      );

      consoleSpy.mockRestore();
    });

    it("tracks module load via utility function", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      trackModuleLoad("utility-module");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Module loaded: utility-module")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("dynamic import monitoring", () => {
    it("enables dynamic import monitoring", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      bundleAnalyzer.monitorDynamicImports();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dynamic import monitoring enabled")
      );

      consoleSpy.mockRestore();
    });
  });
});
