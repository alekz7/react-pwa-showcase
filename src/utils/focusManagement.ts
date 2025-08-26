/**
 * Focus management utilities for accessibility
 */

export interface FocusableElement extends HTMLElement {
  focus(): void;
}

export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private trapStack: HTMLElement[] = [];

  /**
   * Get all focusable elements within a container
   */
  public getFocusableElements(
    container: HTMLElement = document.body
  ): FocusableElement[] {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      "audio[controls]",
      "video[controls]",
      "summary",
    ].join(", ");

    const elements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as FocusableElement[];

    return elements.filter((element) => {
      // Check if element is visible and not hidden
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    });
  }

  /**
   * Set focus to an element and add it to history
   */
  public setFocus(element: HTMLElement, addToHistory: boolean = true): void {
    if (addToHistory && document.activeElement) {
      this.focusHistory.push(document.activeElement as HTMLElement);
    }

    element.focus();

    // Ensure the element is visible
    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  /**
   * Return focus to the previous element in history
   */
  public returnFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      this.setFocus(previousElement, false);
    }
  }

  /**
   * Trap focus within a container (for modals, dialogs)
   */
  public trapFocus(container: HTMLElement): () => void {
    this.trapStack.push(container);

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    this.setFocus(firstElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          this.setFocus(lastElement, false);
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          this.setFocus(firstElement, false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Return cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      this.trapStack.pop();
    };
  }

  /**
   * Create a roving tabindex for a group of elements (for menus, toolbars)
   */
  public createRovingTabindex(
    container: HTMLElement,
    options: {
      orientation?: "horizontal" | "vertical" | "both";
      wrap?: boolean;
      initialIndex?: number;
    } = {}
  ): () => void {
    const { orientation = "both", wrap = true, initialIndex = 0 } = options;
    const elements = this.getFocusableElements(container);

    if (elements.length === 0) return () => {};

    let currentIndex = Math.max(0, Math.min(initialIndex, elements.length - 1));

    // Set initial tabindex values
    elements.forEach((element, index) => {
      element.tabIndex = index === currentIndex ? 0 : -1;
    });

    const updateFocus = (newIndex: number) => {
      elements[currentIndex].tabIndex = -1;
      currentIndex = newIndex;
      elements[currentIndex].tabIndex = 0;
      this.setFocus(elements[currentIndex], false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      let newIndex = currentIndex;

      switch (event.key) {
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= elements.length) {
              newIndex = wrap ? 0 : elements.length - 1;
            }
          }
          break;

        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? elements.length - 1 : 0;
            }
          }
          break;

        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= elements.length) {
              newIndex = wrap ? 0 : elements.length - 1;
            }
          }
          break;

        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? elements.length - 1 : 0;
            }
          }
          break;

        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;

        case "End":
          event.preventDefault();
          newIndex = elements.length - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        updateFocus(newIndex);
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore normal tabindex
      elements.forEach((element) => {
        element.tabIndex = 0;
      });
    };
  }

  /**
   * Announce text to screen readers
   */
  public announce(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.overflow = "hidden";

    document.body.appendChild(announcement);

    // Delay to ensure screen readers pick up the change
    setTimeout(() => {
      announcement.textContent = message;

      // Remove after announcement
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }, 100);
  }

  /**
   * Clear focus history
   */
  public clearHistory(): void {
    this.focusHistory = [];
  }

  /**
   * Get the current focus trap container
   */
  public getCurrentTrap(): HTMLElement | null {
    return this.trapStack.length > 0
      ? this.trapStack[this.trapStack.length - 1]
      : null;
  }
}

// Singleton instance
let focusManager: FocusManager | null = null;

export const getFocusManager = (): FocusManager => {
  if (!focusManager) {
    focusManager = new FocusManager();
  }
  return focusManager;
};

export default FocusManager;
