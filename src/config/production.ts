/**
 * Production configuration and constants
 */

export const PRODUCTION_CONFIG = {
  // App metadata
  APP_NAME: "React PWA Showcase",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  BUILD_DATE: new Date().toISOString(),

  // Performance thresholds
  PERFORMANCE: {
    SLOW_RENDER_THRESHOLD: 3000, // 3 seconds
    MEMORY_WARNING_THRESHOLD: 0.8, // 80% of heap limit
    BUNDLE_SIZE_WARNING: 1000000, // 1MB
    NETWORK_TIMEOUT: 10000, // 10 seconds
  },

  // Error monitoring
  ERROR_MONITORING: {
    ENABLED: import.meta.env.PROD,
    SAMPLE_RATE: 1.0, // 100% in demo, reduce in real production
    MAX_ERRORS_PER_SESSION: 50,
    MAX_PERFORMANCE_REPORTS_PER_SESSION: 100,
  },

  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: import.meta.env.PROD,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_OFFLINE_SUPPORT: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_BACKGROUND_SYNC: true,
  },

  // API endpoints (for demo purposes)
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // Cache configuration
  CACHE: {
    VERSION: "v1",
    MAX_AGE: {
      STATIC_ASSETS: 365 * 24 * 60 * 60, // 1 year
      API_RESPONSES: 24 * 60 * 60, // 1 day
      IMAGES: 30 * 24 * 60 * 60, // 30 days
    },
    MAX_ENTRIES: {
      IMAGES: 100,
      API_RESPONSES: 50,
      STATIC_ASSETS: 200,
    },
  },

  // Security settings
  SECURITY: {
    ENABLE_CSP: true,
    ALLOWED_ORIGINS: [
      "https://yourdomain.github.io",
      "https://localhost:3000",
      "https://localhost:4173",
    ],
    ENABLE_HTTPS_ONLY: import.meta.env.PROD,
  },

  // PWA settings
  PWA: {
    THEME_COLOR: "#2196F3",
    BACKGROUND_COLOR: "#ffffff",
    DISPLAY: "standalone" as const,
    ORIENTATION: "portrait-primary" as const,
    START_URL: "/react-pwa-showcase/",
    SCOPE: "/react-pwa-showcase/",
  },

  // Device capabilities
  DEVICE_CAPABILITIES: {
    REQUIRED: ["serviceWorker", "localStorage", "sessionStorage"],
    OPTIONAL: [
      "camera",
      "microphone",
      "geolocation",
      "deviceMotion",
      "pushNotifications",
      "backgroundSync",
    ],
  },

  // UI/UX settings
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 4000,
    LOADING_DELAY: 200, // Delay before showing loading indicators
    SKELETON_ANIMATION_DURATION: 1500,
  },

  // Development settings
  DEVELOPMENT: {
    ENABLE_REDUX_DEVTOOLS: import.meta.env.DEV,
    ENABLE_CONSOLE_LOGS: import.meta.env.DEV,
    ENABLE_PERFORMANCE_LOGS: import.meta.env.DEV,
    MOCK_API_RESPONSES: import.meta.env.DEV,
  },
} as const;

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const baseConfig = { ...PRODUCTION_CONFIG };

  if (import.meta.env.DEV) {
    return {
      ...baseConfig,
      ERROR_MONITORING: {
        ...baseConfig.ERROR_MONITORING,
        ENABLED: false, // Disable in development
      },
      PERFORMANCE: {
        ...baseConfig.PERFORMANCE,
        SLOW_RENDER_THRESHOLD: 5000, // More lenient in development
      },
    };
  }

  return baseConfig;
};

// Export the active configuration
export const CONFIG = getEnvironmentConfig();

// Utility functions
export const isFeatureEnabled = (
  feature: keyof typeof PRODUCTION_CONFIG.FEATURES
): boolean => {
  return CONFIG.FEATURES[feature];
};

export const getPerformanceThreshold = (
  metric: keyof typeof PRODUCTION_CONFIG.PERFORMANCE
): number => {
  return CONFIG.PERFORMANCE[metric];
};

export const getCacheConfig = (
  type: keyof typeof PRODUCTION_CONFIG.CACHE.MAX_AGE
) => {
  return {
    maxAge: CONFIG.CACHE.MAX_AGE[type],
    maxEntries:
      CONFIG.CACHE.MAX_ENTRIES[
        type as keyof typeof PRODUCTION_CONFIG.CACHE.MAX_ENTRIES
      ] || 50,
  };
};

// Runtime environment detection
export const RUNTIME_INFO = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  isTest: import.meta.env.MODE === "test",
  buildTime: PRODUCTION_CONFIG.BUILD_DATE,
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  platform: typeof navigator !== "undefined" ? navigator.platform : "",
  language: typeof navigator !== "undefined" ? navigator.language : "en",
  cookieEnabled:
    typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
  onLine: typeof navigator !== "undefined" ? navigator.onLine : true,
} as const;
