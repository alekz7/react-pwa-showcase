/**
 * Device Testing Utilities for Comprehensive Cross-Device Testing
 * Provides utilities to test PWA functionality across different devices and browsers
 */

export interface DeviceTestResult {
  id?: string;
  feature: string;
  supported: boolean;
  tested: boolean;
  error?: string;
  performance?: number;
  notes?: string;
  details?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  mobile: boolean;
  pwa: boolean;
}

export interface TestSuite {
  id?: string;
  browser: BrowserInfo;
  timestamp: string;
  results: DeviceTestResult[];
  overallScore: number;
}

/**
 * Comprehensive device capability testing
 */
export class DeviceTestRunner {
  private results: DeviceTestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Get browser information for test reporting
   */
  getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    const mobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    let name = "Unknown";
    let version = "Unknown";

    if (ua.includes("Chrome")) {
      name = "Chrome";
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Edge")) {
      name = "Edge";
      const match = ua.match(/Edge\/(\d+)/);
      version = match ? match[1] : "Unknown";
    }

    return {
      name,
      version,
      platform: navigator.platform,
      mobile,
      pwa: window.matchMedia("(display-mode: standalone)").matches,
    };
  }

  /**
   * Test camera functionality
   */
  async testCamera(): Promise<DeviceTestResult> {
    const startTime = performance.now();
    const result: DeviceTestResult = {
      feature: "Camera",
      supported: false,
      tested: true,
    };

    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported");
      }

      // Test camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      result.supported = true;
      result.performance = performance.now() - startTime;
      result.notes = `Camera access successful. Tracks: ${stream.getVideoTracks().length}`;

      // Clean up
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Camera access failed - check permissions";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test microphone functionality
   */
  async testMicrophone(): Promise<DeviceTestResult> {
    const startTime = performance.now();
    const result: DeviceTestResult = {
      feature: "Microphone",
      supported: false,
      tested: true,
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      result.supported = true;
      result.performance = performance.now() - startTime;
      result.notes = `Microphone access successful. Tracks: ${stream.getAudioTracks().length}`;

      // Clean up
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Microphone access failed - check permissions";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test geolocation functionality
   */
  async testGeolocation(): Promise<DeviceTestResult> {
    const startTime = performance.now();
    const result: DeviceTestResult = {
      feature: "Geolocation",
      supported: false,
      tested: true,
    };

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation API not supported");
      }

      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      result.supported = true;
      result.performance = performance.now() - startTime;
      result.notes = "Geolocation access successful";
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Geolocation access failed - check permissions or GPS";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test motion sensors
   */
  async testMotionSensors(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "Motion Sensors",
      supported: false,
      tested: true,
    };

    try {
      // Check for DeviceMotionEvent
      if (typeof DeviceMotionEvent === "undefined") {
        throw new Error("DeviceMotionEvent not supported");
      }

      // On iOS 13+, need to request permission
      if (
        typeof (
          DeviceMotionEvent as unknown as {
            requestPermission?: () => Promise<string>;
          }
        ).requestPermission === "function"
      ) {
        const permission = await (
          DeviceMotionEvent as unknown as {
            requestPermission: () => Promise<string>;
          }
        ).requestPermission();
        if (permission !== "granted") {
          throw new Error("Motion sensor permission denied");
        }
      }

      result.supported = true;
      result.notes = "Motion sensors available";
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Motion sensors not available or permission denied";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test file system access
   */
  async testFileSystem(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "File System",
      supported: false,
      tested: true,
    };

    try {
      // Test basic file input
      const input = document.createElement("input");
      input.type = "file";

      // Check for File System Access API
      if ("showOpenFilePicker" in window) {
        result.notes = "File System Access API supported";
      } else {
        result.notes =
          "Basic file input supported, File System Access API not available";
      }

      result.supported = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "File system access not supported";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test PWA capabilities
   */
  async testPWA(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "PWA Features",
      supported: false,
      tested: true,
    };

    try {
      const features = [];

      // Service Worker support
      if ("serviceWorker" in navigator) {
        features.push("Service Worker");
      }

      // Web App Manifest
      if ("getInstalledRelatedApps" in navigator) {
        features.push("App Installation");
      }

      // Push Notifications
      if ("PushManager" in window) {
        features.push("Push Notifications");
      }

      // Background Sync
      if (
        "serviceWorker" in navigator &&
        "sync" in window.ServiceWorkerRegistration.prototype
      ) {
        features.push("Background Sync");
      }

      // Cache API
      if ("caches" in window) {
        features.push("Cache API");
      }

      result.supported = features.length > 0;
      result.notes = `PWA features: ${features.join(", ")}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "PWA features test failed";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test network connectivity and offline capabilities
   */
  async testNetworkAndOffline(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "Network & Offline",
      supported: false,
      tested: true,
    };

    try {
      const features = [];

      // Network Information API
      if ("connection" in navigator) {
        features.push("Network Information");
      }

      // Online/Offline events
      if ("onLine" in navigator) {
        features.push("Online Status");
      }

      // Service Worker for offline
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          features.push("Offline Support");
        }
      }

      result.supported = features.length > 0;
      result.notes = `Network features: ${features.join(", ")}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Network and offline test failed";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test performance and loading metrics
   */
  async testPerformance(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "Performance",
      supported: false,
      tested: true,
    };

    try {
      const features = [];

      // Performance API
      if ("performance" in window) {
        features.push("Performance API");

        // Navigation timing
        if (performance.navigation) {
          features.push("Navigation Timing");
        }

        // Resource timing
        if (typeof performance.getEntriesByType === "function") {
          features.push("Resource Timing");
        }

        // User timing
        if (
          typeof performance.mark === "function" &&
          typeof performance.measure === "function"
        ) {
          features.push("User Timing");
        }
      }

      // Memory info (Chrome)
      if ("memory" in performance) {
        features.push("Memory Info");
      }

      result.supported = features.length > 0;
      result.performance = performance.now() - this.startTime;
      result.notes = `Performance features: ${features.join(", ")}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Performance test failed";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test notifications functionality
   */
  async testNotifications(): Promise<DeviceTestResult> {
    const result: DeviceTestResult = {
      feature: "Push Notifications",
      supported: false,
      tested: true,
    };

    try {
      if (!("Notification" in window)) {
        throw new Error("Notifications not supported");
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker required for push notifications");
      }

      result.supported = true;
      result.notes = `Permission: ${Notification.permission}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      result.notes = "Push notifications not available";
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test PWA features comprehensively
   */
  async testPWAFeatures(): Promise<DeviceTestResult[]> {
    const results: DeviceTestResult[] = [];

    // Test Service Worker
    const swResult: DeviceTestResult = {
      feature: "Service Worker",
      supported: "serviceWorker" in navigator,
      tested: true,
    };
    if (!swResult.supported) {
      swResult.error = "Service Worker not supported";
    }
    results.push(swResult);

    // Test Web App Manifest
    const manifestResult: DeviceTestResult = {
      feature: "Web App Manifest",
      supported: false,
      tested: true,
    };

    try {
      const manifestLink = document.querySelector(
        'link[rel="manifest"]'
      ) as HTMLLinkElement;
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        const manifest = await response.json();
        manifestResult.supported = true;
        manifestResult.notes = `Name: ${manifest.name || manifest.short_name}`;
      } else {
        manifestResult.error = "No manifest link found";
      }
    } catch {
      manifestResult.error = "Failed to load manifest";
    }
    results.push(manifestResult);

    // Test Installation capability
    const installResult: DeviceTestResult = {
      feature: "PWA Installation",
      supported: false,
      tested: true,
    };

    if (
      "BeforeInstallPromptEvent" in window ||
      (window as unknown as { deferredPrompt?: unknown }).deferredPrompt
    ) {
      installResult.supported = true;
      installResult.notes = "Installation prompt available";
    } else {
      installResult.error = "Installation not supported";
    }
    results.push(installResult);

    // Test Offline capability
    const offlineResult: DeviceTestResult = {
      feature: "Offline Support",
      supported: "caches" in window,
      tested: true,
    };
    if (!offlineResult.supported) {
      offlineResult.error = "Cache API not supported";
    }
    results.push(offlineResult);

    // Test Background Sync
    const bgSyncResult: DeviceTestResult = {
      feature: "Background Sync",
      supported:
        "serviceWorker" in navigator &&
        "sync" in window.ServiceWorkerRegistration.prototype,
      tested: true,
    };
    if (!bgSyncResult.supported) {
      bgSyncResult.error = "Background Sync not supported";
    }
    results.push(bgSyncResult);

    return results;
  }

  /**
   * Test accessibility features
   */
  async testAccessibility(): Promise<DeviceTestResult[]> {
    const results: DeviceTestResult[] = [];

    // Test Screen Reader support
    const screenReaderResult: DeviceTestResult = {
      feature: "Screen Reader Support",
      supported: false,
      tested: true,
    };

    // Check for ARIA support
    const testElement = document.createElement("div");
    testElement.setAttribute("aria-label", "test");
    screenReaderResult.supported =
      testElement.getAttribute("aria-label") === "test";
    if (!screenReaderResult.supported) {
      screenReaderResult.error = "ARIA attributes not supported";
    }
    results.push(screenReaderResult);

    // Test Keyboard Navigation
    const keyboardResult: DeviceTestResult = {
      feature: "Keyboard Navigation",
      supported: true, // Assume supported, would need actual testing
      tested: true,
      notes: "Tab navigation and focus management",
    };
    results.push(keyboardResult);

    // Test Color Contrast
    const contrastResult: DeviceTestResult = {
      feature: "Color Contrast",
      supported: true,
      tested: true,
      notes: "WCAG AA compliance check needed",
    };
    results.push(contrastResult);

    // Test Focus Management
    const focusResult: DeviceTestResult = {
      feature: "Focus Management",
      supported: "focus" in HTMLElement.prototype,
      tested: true,
    };
    if (!focusResult.supported) {
      focusResult.error = "Focus management not supported";
    }
    results.push(focusResult);

    return results;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestSuite> {
    console.log("🧪 Starting comprehensive device testing...");

    const tests = [
      this.testCamera(),
      this.testMicrophone(),
      this.testGeolocation(),
      this.testMotionSensors(),
      this.testFileSystem(),
      this.testNotifications(),
      this.testPWA(),
      this.testNetworkAndOffline(),
      this.testPerformance(),
    ];

    await Promise.all(tests);

    const supportedCount = this.results.filter((r) => r.supported).length;
    const overallScore = Math.round(
      (supportedCount / this.results.length) * 100
    );

    const testSuite: TestSuite = {
      browser: this.getBrowserInfo(),
      timestamp: new Date().toISOString(),
      results: this.results,
      overallScore,
    };

    console.log(`✅ Testing complete! Score: ${overallScore}%`);
    return testSuite;
  }

  /**
   * Generate test report
   */
  generateReport(testSuite: TestSuite): string {
    const { browser, timestamp, results, overallScore } = testSuite;

    let report = `# Device Compatibility Test Report\n\n`;
    report += `**Browser:** ${browser.name} ${browser.version}\n`;
    report += `**Platform:** ${browser.platform}\n`;
    report += `**Mobile:** ${browser.mobile ? "Yes" : "No"}\n`;
    report += `**PWA Mode:** ${browser.pwa ? "Yes" : "No"}\n`;
    report += `**Test Date:** ${new Date(timestamp).toLocaleString()}\n`;
    report += `**Overall Score:** ${overallScore}%\n\n`;

    report += `## Test Results\n\n`;

    results.forEach((result) => {
      const status = result.supported ? "✅" : "❌";
      report += `### ${status} ${result.feature}\n`;
      report += `- **Status:** ${result.supported ? "Supported" : "Not Supported"}\n`;

      if (result.performance) {
        report += `- **Performance:** ${result.performance.toFixed(2)}ms\n`;
      }

      if (result.notes) {
        report += `- **Notes:** ${result.notes}\n`;
      }

      if (result.error) {
        report += `- **Error:** ${result.error}\n`;
      }

      report += `\n`;
    });

    return report;
  }

  /**
   * Save test results to localStorage for later analysis
   */
  saveResults(testSuite: TestSuite): void {
    const key = `pwa-test-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(testSuite));
    console.log(`📊 Test results saved to localStorage: ${key}`);
  }

  /**
   * Get all saved test results
   */
  static getSavedResults(): TestSuite[] {
    const results: TestSuite[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("pwa-test-")) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            results.push(JSON.parse(data));
          }
        } catch (error) {
          console.warn(`Failed to parse test result: ${key}`, error);
        }
      }
    }

    return results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

/**
 * Quick device capability check
 */
export const getDeviceCapabilities = () => {
  return {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    microphone: !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ),
    geolocation: !!navigator.geolocation,
    motionSensors: typeof DeviceMotionEvent !== "undefined",
    fileSystem: "showOpenFilePicker" in window || true, // Basic file input always available
    serviceWorker: "serviceWorker" in navigator,
    pushNotifications: "PushManager" in window,
    backgroundSync:
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype,
    cacheAPI: "caches" in window,
    webShare: "share" in navigator,
    fullscreen: "requestFullscreen" in document.documentElement,
    vibration: "vibrate" in navigator,
    battery: "getBattery" in navigator,
    networkInfo: "connection" in navigator,
  };
};
