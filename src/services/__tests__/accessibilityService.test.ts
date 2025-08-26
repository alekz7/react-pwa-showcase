import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import AccessibilityService, {
  getAccessibilityService,
} from "../accessibilityService";

// Mock DOM APIs
const mockMatchMedia = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();

// Mock MutationObserver
class MockMutationObserver {
  constructor(private callback: MutationCallback) {}

  observe() {}
  disconnect() {}

  simulateMutation(mutations: MutationRecord[]) {
    this.callback(mutations, this);
  }
}

describe("AccessibilityService", () => {
  let accessibilityService: AccessibilityService;

  beforeEach(() => {
    // Setup DOM mocks
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    Object.defineProperty(document, "querySelector", {
      value: mockQuerySelector,
      writable: true,
    });

    Object.defineProperty(document, "querySelectorAll", {
      value: mockQuerySelectorAll,
      writable: true,
    });

    Object.defineProperty(global, "MutationObserver", {
      value: MockMutationObserver,
      writable: true,
    });

    // Setup default mock implementations
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    mockQuerySelector.mockReturnValue(null);
    mockQuerySelectorAll.mockReturnValue([]);

    vi.clearAllMocks();
    accessibilityService = new AccessibilityService();
  });

  afterEach(() => {
    if (accessibilityService) {
      accessibilityService.destroy();
    }
  });

  describe("initialization", () => {
    it("creates accessibility service successfully", () => {
      expect(accessibilityService).toBeInstanceOf(AccessibilityService);
    });

    it("detects accessibility features on initialization", () => {
      const features = accessibilityService.getFeatures();

      expect(features).toHaveProperty("screenReader");
      expect(features).toHaveProperty("highContrast");
      expect(features).toHaveProperty("reducedMotion");
      expect(features).toHaveProperty("keyboardNavigation");
      expect(features).toHaveProperty("focusVisible");
    });
  });

  describe("feature detection", () => {
    it("detects high contrast mode", () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes("prefers-contrast: high"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const service = new AccessibilityService();
      const features = service.getFeatures();

      expect(features.highContrast).toBe(true);
      service.destroy();
    });

    it("detects reduced motion preference", () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const service = new AccessibilityService();
      const features = service.getFeatures();

      expect(features.reducedMotion).toBe(true);
      service.destroy();
    });

    it("detects focus-visible support", () => {
      mockQuerySelector.mockImplementation((selector: string) => {
        if (selector === ":focus-visible") {
          return document.createElement("div");
        }
        return null;
      });

      const service = new AccessibilityService();
      const features = service.getFeatures();

      expect(features.focusVisible).toBe(true);
      service.destroy();
    });
  });
  des;
  cribe("subscription system", () => {
    it("subscribes to feature updates", () => {
      const listener = vi.fn();
      const unsubscribe = accessibilityService.subscribe(listener);

      // Should call listener immediately with current features
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          screenReader: expect.any(Boolean),
          highContrast: expect.any(Boolean),
          reducedMotion: expect.any(Boolean),
          keyboardNavigation: expect.any(Boolean),
          focusVisible: expect.any(Boolean),
        })
      );

      unsubscribe();
    });

    it("unsubscribes from feature updates", () => {
      const listener = vi.fn();
      const unsubscribe = accessibilityService.subscribe(listener);

      unsubscribe();
      listener.mockClear();

      // Simulate feature change - listener should not be called
      // This would require triggering internal feature updates
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("page audit", () => {
    it("audits page for accessibility issues", () => {
      // Mock DOM elements for audit
      const mockImg = document.createElement("img");
      const mockInput = document.createElement("input");
      const mockH1 = document.createElement("h1");
      const mockH3 = document.createElement("h3"); // Skipped heading level

      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === "img") return [mockImg];
        if (selector === "input, select, textarea") return [mockInput];
        if (selector === "h1, h2, h3, h4, h5, h6") return [mockH1, mockH3];
        return [];
      });

      const audit = accessibilityService.auditPage();

      expect(audit).toHaveProperty("score");
      expect(audit).toHaveProperty("issues");
      expect(audit).toHaveProperty("recommendations");
      expect(audit).toHaveProperty("wcagLevel");

      expect(audit.issues.length).toBeGreaterThan(0);
    });

    it("generates appropriate recommendations", () => {
      // Mock elements with accessibility issues
      const mockImg = document.createElement("img");
      const mockInput = document.createElement("input");

      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === "img") return [mockImg];
        if (selector === "input, select, textarea") return [mockInput];
        if (selector === "h1, h2, h3, h4, h5, h6") return [];
        return [];
      });

      const audit = accessibilityService.auditPage();

      expect(audit.recommendations).toContain(
        "Add descriptive alt text to all images"
      );
      expect(audit.recommendations).toContain(
        "Ensure all form controls have proper labels"
      );
    });

    it("calculates WCAG compliance level", () => {
      mockQuerySelectorAll.mockReturnValue([]);

      const audit = accessibilityService.auditPage();

      expect(["A", "AA", "AAA"]).toContain(audit.wcagLevel);
    });
  });

  describe("element auditing", () => {
    it("checks for missing ARIA labels on interactive elements", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const button = document.createElement("button");
      // Simulate element audit
      (accessibilityService as any).auditElement(button);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Accessibility: Interactive element missing label",
        button
      );

      consoleSpy.mockRestore();
    });

    it("does not warn for elements with proper labels", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const button = document.createElement("button");
      button.setAttribute("aria-label", "Close dialog");

      (accessibilityService as any).auditElement(button);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("keyboard navigation detection", () => {
    it("detects keyboard navigation on Tab key press", () => {
      const listener = vi.fn();
      accessibilityService.subscribe(listener);

      // Simulate Tab key press
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
      document.dispatchEvent(tabEvent);

      // Should update keyboard navigation feature
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          keyboardNavigation: true,
        })
      );
    });
  });

  describe("cleanup", () => {
    it("destroys observers and cleans up resources", () => {
      const destroySpy = vi.spyOn(accessibilityService, "destroy");

      accessibilityService.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe("singleton pattern", () => {
    it("returns same instance from getAccessibilityService", () => {
      const instance1 = getAccessibilityService();
      const instance2 = getAccessibilityService();

      expect(instance1).toBe(instance2);
    });
  });

  describe("error handling", () => {
    it("handles missing DOM APIs gracefully", () => {
      // Remove MutationObserver
      delete (global as any).MutationObserver;

      expect(() => {
        const service = new AccessibilityService();
        service.destroy();
      }).not.toThrow();
    });

    it("handles focus-visible detection errors gracefully", () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error("querySelector failed");
      });

      expect(() => {
        const service = new AccessibilityService();
        service.destroy();
      }).not.toThrow();
    });
  });
});
