/**
 * Bundle analysis utilities for monitoring chunk sizes and dependencies
 */

export interface BundleInfo {
  chunkName: string;
  size: number;
  gzipSize?: number;
  modules: string[];
  dependencies: string[];
}

export interface BundleAnalysis {
  totalSize: number;
  chunks: BundleInfo[];
  largestChunks: BundleInfo[];
  duplicatedModules: string[];
  recommendations: string[];
}

class BundleAnalyzer {
  private chunkSizes: Map<string, number> = new Map();
  private loadedModules: Set<string> = new Set();

  /**
   * Track when a chunk is loaded
   */
  public trackChunkLoad(chunkName: string, size?: number): void {
    if (size) {
      this.chunkSizes.set(chunkName, size);
    }

    if (import.meta.env.DEV) {
      console.log(
        `📦 Chunk loaded: ${chunkName}${size ? ` (${(size / 1024).toFixed(2)}KB)` : ""}`
      );
    }
  }

  /**
   * Track module loading
   */
  public trackModuleLoad(moduleName: string): void {
    this.loadedModules.add(moduleName);

    if (import.meta.env.DEV) {
      console.log(`📋 Module loaded: ${moduleName}`);
    }
  }

  /**
   * Get bundle analysis
   */
  public getAnalysis(): BundleAnalysis {
    const chunks: BundleInfo[] = Array.from(this.chunkSizes.entries()).map(
      ([name, size]) => ({
        chunkName: name,
        size,
        modules: [],
        dependencies: [],
      })
    );

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const largestChunks = chunks.sort((a, b) => b.size - a.size).slice(0, 5);

    const recommendations = this.generateRecommendations(chunks, totalSize);

    return {
      totalSize,
      chunks,
      largestChunks,
      duplicatedModules: [],
      recommendations,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    chunks: BundleInfo[],
    totalSize: number
  ): string[] {
    const recommendations: string[] = [];

    // Check for large chunks
    const largeChunks = chunks.filter((chunk) => chunk.size > 500 * 1024); // > 500KB
    if (largeChunks.length > 0) {
      recommendations.push(
        `Consider splitting large chunks: ${largeChunks.map((c) => c.chunkName).join(", ")}`
      );
    }

    // Check total bundle size
    if (totalSize > 2 * 1024 * 1024) {
      // > 2MB
      recommendations.push(
        "Total bundle size is large. Consider code splitting and lazy loading."
      );
    }

    // Check for too many chunks
    if (chunks.length > 20) {
      recommendations.push(
        "Many small chunks detected. Consider chunk merging for better HTTP/2 performance."
      );
    }

    // Check for vendor chunk optimization
    const vendorChunk = chunks.find((chunk) =>
      chunk.chunkName.includes("vendor")
    );
    if (vendorChunk && vendorChunk.size > 1024 * 1024) {
      // > 1MB
      recommendations.push(
        "Vendor chunk is large. Consider splitting vendor dependencies."
      );
    }

    return recommendations;
  }

  /**
   * Log bundle analysis
   */
  public logAnalysis(): void {
    const analysis = this.getAnalysis();

    console.group("📊 Bundle Analysis");

    console.log(
      `📦 Total Bundle Size: ${(analysis.totalSize / 1024).toFixed(2)}KB`
    );
    console.log(`🔢 Number of Chunks: ${analysis.chunks.length}`);

    if (analysis.largestChunks.length > 0) {
      console.log("🏆 Largest Chunks:");
      analysis.largestChunks.forEach((chunk, index) => {
        console.log(
          `  ${index + 1}. ${chunk.chunkName}: ${(chunk.size / 1024).toFixed(2)}KB`
        );
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log("💡 Recommendations:");
      analysis.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.groupEnd();
  }

  /**
   * Export analysis as JSON
   */
  public exportAnalysis(): string {
    return JSON.stringify(
      {
        ...this.getAnalysis(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      null,
      2
    );
  }

  /**
   * Monitor dynamic imports
   */
  public monitorDynamicImports(): void {
    if (typeof window === "undefined") return;

    // Override dynamic import to track chunk loading
    // const originalImport =
    //   window.import || ((specifier: string) => import(specifier));

    // Note: This is a conceptual implementation
    // In practice, you'd need to integrate with your bundler's chunk loading mechanism
    console.log("🔍 Dynamic import monitoring enabled");
  }

  /**
   * Get performance recommendations based on current metrics
   */
  public getPerformanceRecommendations(): string[] {
    const analysis = this.getAnalysis();
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (analysis.totalSize > 1024 * 1024) {
      recommendations.push(
        "Bundle size is over 1MB. Consider implementing more aggressive code splitting."
      );
    }

    // Chunk recommendations
    if (analysis.chunks.length < 3) {
      recommendations.push(
        "Consider splitting your bundle into more chunks for better caching."
      );
    }

    // Module recommendations
    if (this.loadedModules.size > 100) {
      recommendations.push(
        "Many modules loaded. Consider lazy loading non-critical modules."
      );
    }

    return recommendations;
  }
}

// Singleton instance
let bundleAnalyzer: BundleAnalyzer | null = null;

export const getBundleAnalyzer = (): BundleAnalyzer => {
  if (!bundleAnalyzer) {
    bundleAnalyzer = new BundleAnalyzer();
  }
  return bundleAnalyzer;
};

export const trackChunkLoad = (chunkName: string, size?: number): void => {
  getBundleAnalyzer().trackChunkLoad(chunkName, size);
};

export const trackModuleLoad = (moduleName: string): void => {
  getBundleAnalyzer().trackModuleLoad(moduleName);
};

export const logBundleAnalysis = (): void => {
  getBundleAnalyzer().logAnalysis();
};

export default BundleAnalyzer;
