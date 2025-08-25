/**
 * Cache Manager Utility
 * Provides methods for managing application cache and offline data
 */

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiry?: number;
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheManager {
  private readonly prefix = "pwa_showcase_";
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store data in cache with optional TTL
   */
  set(key: string, data: any, ttl?: number): boolean {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : Date.now() + this.defaultTTL,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.warn("Failed to cache data:", error);
      return false;
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T = any>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.prefix + key);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);

      // Check if expired
      if (entry.expiry && Date.now() > entry.expiry) {
        this.delete(key);
        return null;
      }

      return entry.data as T;
    } catch (error) {
      console.warn("Failed to retrieve cached data:", error);
      return null;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.warn("Failed to delete cache entry:", error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn("Failed to clear cache:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(this.prefix));

    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    cacheKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          const entry: CacheEntry = JSON.parse(value);
          if (entry.timestamp < oldestEntry) oldestEntry = entry.timestamp;
          if (entry.timestamp > newestEntry) newestEntry = entry.timestamp;
        }
      } catch (error) {
        // Skip invalid entries
      }
    });

    return {
      totalSize,
      entryCount: cacheKeys.length,
      oldestEntry: cacheKeys.length > 0 ? oldestEntry : 0,
      newestEntry: cacheKeys.length > 0 ? newestEntry : 0,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(this.prefix));
    let cleanedCount = 0;

    cacheKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const entry: CacheEntry = JSON.parse(value);
          if (entry.expiry && Date.now() > entry.expiry) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Remove invalid entries
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.substring(this.prefix.length));
  }

  /**
   * Cache demo data for offline use
   */
  cacheDemoData(demoType: string, data: any): boolean {
    return this.set(`demo_${demoType}`, data, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Get cached demo data
   */
  getCachedDemoData<T = any>(demoType: string): T | null {
    return this.get<T>(`demo_${demoType}`);
  }

  /**
   * Cache user preferences
   */
  cacheUserPreferences(preferences: any): boolean {
    return this.set("user_preferences", preferences, 365 * 24 * 60 * 60 * 1000); // 1 year
  }

  /**
   * Get cached user preferences
   */
  getCachedUserPreferences<T = any>(): T | null {
    return this.get<T>("user_preferences");
  }

  /**
   * Cache device capabilities
   */
  cacheDeviceCapabilities(capabilities: any): boolean {
    return this.set("device_capabilities", capabilities, 24 * 60 * 60 * 1000); // 1 day
  }

  /**
   * Get cached device capabilities
   */
  getCachedDeviceCapabilities<T = any>(): T | null {
    return this.get<T>("device_capabilities");
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export utility functions
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getCacheAge = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

export default cacheManager;
