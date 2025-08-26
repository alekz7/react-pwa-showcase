import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import FocusManager, { getFocusManager } from "../focusManagement";

// Mock DOM methods
const mockQuerySelectorAll = vi.fn();
const mockScrollIntoView = vi.fn();
const mockFocus = vi.fn();

describe("FocusManager", () => {
  let focusManager: FocusManager;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    focusManager = new FocusManager();

    // Create mock container
    mockContainer = {
      querySelectorAll: mockQuerySelectorAll,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    // Setup DOM mocks
    Object.defineProperty(document, "contains", {
      value: vi.fn(() => true),
      writable: true,
    });

    Object.defineProperty(document, "activeElement", {
      value: null,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    focusManager.clearHistory();
  });

  describe("focusable element detection", () => {
    it("finds focusable elements in container", () => {
      const mockButton = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
        offsetWidth: 100,
        offsetHeight: 50,
      };

      const mockInput = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
        offsetWidth: 200,
        offsetHeight: 30,
      };

      mockQuerySelectorAll.mockReturnValue([mockButton, mockInput]);

      // Mock getComputedStyle
      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      const focusableElements =
        focusManager.getFocusableElements(mockContainer);

      expect(focusableElements).toHaveLength(2);
      expect(focusableElements).toContain(mockButton);
      expect(focusableElements).toContain(mockInput);
    });

    it("filters out hidden elements", () => {
      const mockVisibleButton = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
        offsetWidth: 100,
        offsetHeight: 50,
      };

      const mockHiddenButton = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
        offsetWidth: 0,
        offsetHeight: 0,
      };

      mockQuerySelectorAll.mockReturnValue([
        mockVisibleButton,
        mockHiddenButton,
      ]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      const focusableElements =
        focusManager.getFocusableElements(mockContainer);

      expect(focusableElements).toHaveLength(1);
      expect(focusableElements).toContain(mockVisibleButton);
    });

    it("filters out elements with display: none", () => {
      const mockButton = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
        offsetWidth: 100,
        offsetHeight: 50,
      };

      mockQuerySelectorAll.mockReturnValue([mockButton]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "none",
          visibility: "visible",
        })),
        writable: true,
      });

      const focusableElements =
        focusManager.getFocusableElements(mockContainer);

      expect(focusableElements).toHaveLength(0);
    });
  });

  describe("focus management", () => {
    it("sets focus to element and adds to history", () => {
      const mockElement = {
        focus: mockFocus,
        scrollIntoView: mockScrollIntoView,
      } as any;

      const mockActiveElement = {
        focus: mockFocus,
      } as any;

      Object.defineProperty(document, "activeElement", {
        value: mockActiveElement,
        writable: true,
      });

      focusManager.setFocus(mockElement, true);

      expect(mockFocus).toHaveBeenCalled();
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    it("returns focus to previous element", () => {
      const mockElement1 = { focus: vi.fn() } as any;
      const mockElement2 = { focus: vi.fn() } as any;

      Object.defineProperty(document, "activeElement", {
        value: mockElement1,
        writable: true,
      });

      focusManager.setFocus(mockElement2, true);
      focusManager.returnFocus();

      expect(mockElement1.focus).toHaveBeenCalled();
    });

    it("does not return focus if previous element is not in document", () => {
      const mockElement1 = { focus: vi.fn() } as any;
      const mockElement2 = { focus: vi.fn() } as any;

      Object.defineProperty(document, "activeElement", {
        value: mockElement1,
        writable: true,
      });

      Object.defineProperty(document, "contains", {
        value: vi.fn(() => false),
        writable: true,
      });

      focusManager.setFocus(mockElement2, true);
      focusManager.returnFocus();

      expect(mockElement1.focus).not.toHaveBeenCalled();
    });
  });

  describe("focus trapping", () => {
    it("traps focus within container", () => {
      const mockFirstElement = { focus: vi.fn() } as any;
      const mockLastElement = { focus: vi.fn() } as any;

      mockQuerySelectorAll.mockReturnValue([mockFirstElement, mockLastElement]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      const cleanup = focusManager.trapFocus(mockContainer);

      expect(mockFirstElement.focus).toHaveBeenCalled();
      expect(typeof cleanup).toBe("function");

      cleanup();
    });

    it("handles Tab key in focus trap", () => {
      const mockFirstElement = { focus: vi.fn() } as any;
      const mockLastElement = { focus: vi.fn() } as any;

      mockQuerySelectorAll.mockReturnValue([mockFirstElement, mockLastElement]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      Object.defineProperty(document, "activeElement", {
        value: mockLastElement,
        writable: true,
      });

      const cleanup = focusManager.trapFocus(mockContainer);

      // Simulate Tab key press
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
      Object.defineProperty(tabEvent, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(tabEvent);

      cleanup();
    });

    it("returns empty cleanup function for containers with no focusable elements", () => {
      mockQuerySelectorAll.mockReturnValue([]);

      const cleanup = focusManager.trapFocus(mockContainer);

      expect(typeof cleanup).toBe("function");
      cleanup();
    });
  });

  describe("roving tabindex", () => {
    it("creates roving tabindex for element group", () => {
      const mockElement1 = {
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
        tabIndex: 0,
        offsetWidth: 100,
        offsetHeight: 50,
      } as any;

      const mockElement2 = {
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
        tabIndex: 0,
        offsetWidth: 100,
        offsetHeight: 50,
      } as any;

      mockQuerySelectorAll.mockReturnValue([mockElement1, mockElement2]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      const cleanup = focusManager.createRovingTabindex(mockContainer);

      expect(mockElement1.tabIndex).toBe(0);
      expect(mockElement2.tabIndex).toBe(-1);
      expect(typeof cleanup).toBe("function");

      cleanup();
    });

    it("handles arrow key navigation", () => {
      const mockElement1 = {
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
        tabIndex: 0,
        offsetWidth: 100,
        offsetHeight: 50,
      } as any;

      const mockElement2 = {
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
        tabIndex: 0,
        offsetWidth: 100,
        offsetHeight: 50,
      } as any;

      mockQuerySelectorAll.mockReturnValue([mockElement1, mockElement2]);

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(() => ({
          display: "block",
          visibility: "visible",
        })),
        writable: true,
      });

      const cleanup = focusManager.createRovingTabindex(mockContainer, {
        orientation: "horizontal",
      });

      // Simulate ArrowRight key press
      const arrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
      Object.defineProperty(arrowEvent, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      mockContainer.dispatchEvent(arrowEvent);

      cleanup();
    });
  });

  describe("announcements", () => {
    it("announces text to screen readers", () => {
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      Object.defineProperty(document, "body", {
        value: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
        writable: true,
      });

      Object.defineProperty(document, "createElement", {
        value: vi.fn(() => ({
          setAttribute: vi.fn(),
          style: {},
          textContent: "",
        })),
        writable: true,
      });

      focusManager.announce("Test announcement");

      expect(mockAppendChild).toHaveBeenCalled();
    });
  });

  describe("utility methods", () => {
    it("clears focus history", () => {
      const mockElement = { focus: vi.fn() } as any;

      Object.defineProperty(document, "activeElement", {
        value: mockElement,
        writable: true,
      });

      focusManager.setFocus(mockElement, true);
      focusManager.clearHistory();
      focusManager.returnFocus();

      // Should not focus anything after clearing history
      expect(mockElement.focus).toHaveBeenCalledTimes(1); // Only from setFocus
    });

    it("gets current focus trap container", () => {
      expect(focusManager.getCurrentTrap()).toBeNull();

      const cleanup = focusManager.trapFocus(mockContainer);
      expect(focusManager.getCurrentTrap()).toBe(mockContainer);

      cleanup();
      expect(focusManager.getCurrentTrap()).toBeNull();
    });
  });

  describe("singleton pattern", () => {
    it("returns same instance from getFocusManager", () => {
      const instance1 = getFocusManager();
      const instance2 = getFocusManager();

      expect(instance1).toBe(instance2);
    });
  });
});
