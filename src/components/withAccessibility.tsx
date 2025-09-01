import React, { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { getFocusManager } from "../utils/focusManagement";
import { useAccessibility } from "../hooks/useAccessibility";

interface WithAccessibilityOptions {
  /**
   * Component name for announcements
   */
  componentName?: string;

  /**
   * Whether to announce when component mounts
   */
  announceOnMount?: boolean;

  /**
   * Whether to manage focus when component mounts
   */
  autoFocus?: boolean;

  /**
   * Whether to add keyboard navigation support
   */
  keyboardNavigation?: boolean;

  /**
   * ARIA role for the component
   */
  role?: string;

  /**
   * ARIA label for the component
   */
  ariaLabel?: string;

  /**
   * Whether to add skip links
   */
  skipLinks?: boolean;

  /**
   * Custom keyboard shortcuts
   */
  shortcuts?: Record<string, () => void>;
}

/**
 * Higher-order component that adds accessibility features to any component
 */
export function withAccessibility<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAccessibilityOptions = {}
) {
  const {
    componentName = WrappedComponent.displayName ||
      WrappedComponent.name ||
      "Component",
    announceOnMount = false,
    autoFocus = false,
    keyboardNavigation = false,
    role,
    ariaLabel,
    skipLinks = false,
    shortcuts = {},
  } = options;

  const WithAccessibilityComponent: React.FC<P> = (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { announceToScreenReader, isScreenReaderActive } = useAccessibility();
    const focusManager = getFocusManager();

    useEffect(() => {
      if (announceOnMount && isScreenReaderActive) {
        announceToScreenReader(`${componentName} loaded`);
      }

      if (autoFocus && containerRef.current) {
        const focusableElements = focusManager.getFocusableElements(
          containerRef.current
        );
        if (focusableElements.length > 0) {
          focusManager.setFocus(focusableElements[0]);
        }
      }
    }, [announceToScreenReader, isScreenReaderActive, focusManager]);

    useEffect(() => {
      if (!keyboardNavigation || !containerRef.current) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Handle custom shortcuts
        const shortcutKey = `${event.ctrlKey ? "Ctrl+" : ""}${event.altKey ? "Alt+" : ""}${event.shiftKey ? "Shift+" : ""}${event.key}`;

        if (shortcuts[shortcutKey]) {
          event.preventDefault();
          shortcuts[shortcutKey]();
          return;
        }

        // Handle common navigation keys
        switch (event.key) {
          case "Escape": {
            // Find and focus the closest focusable parent or document.body
            const focusableParents = document.querySelectorAll(
              '[tabindex="0"], button, a, input, select, textarea'
            );
            const parentElement = Array.from(focusableParents).find(
              (el) => containerRef.current && el.contains(containerRef.current)
            );

            if (parentElement) {
              (parentElement as HTMLElement).focus();
            } else {
              document.body.focus();
            }
            break;
          }

          case "F6": {
            // Move to next landmark
            event.preventDefault();
            const landmarks = document.querySelectorAll(
              '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer'
            );
            const currentIndex = Array.from(landmarks).findIndex(
              (landmark) =>
                containerRef.current && landmark.contains(containerRef.current)
            );

            const nextLandmark = landmarks[currentIndex + 1] || landmarks[0];
            if (nextLandmark) {
              (nextLandmark as HTMLElement).focus();
            }
            break;
          }
        }
      };

      const container = containerRef.current;
      container.addEventListener("keydown", handleKeyDown);

      return () => {
        container.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    // Enhanced props with accessibility attributes
    const enhancedProps = {
      ...props,
      ref: containerRef,
      role,
      "aria-label": ariaLabel || componentName,
      tabIndex: keyboardNavigation ? 0 : undefined,
    };

    return (
      <div {...enhancedProps}>
        {skipLinks && (
          <div
            style={{
              position: "absolute",
              left: "-10000px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <a
              href="#main-content"
              style={{
                position: "absolute",
                left: "6px",
                top: "-40px",
                zIndex: 9999,
                padding: "8px 16px",
                backgroundColor: "#000",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "4px",
              }}
              onFocus={(e) => {
                e.target.style.top = "6px";
              }}
              onBlur={(e) => {
                e.target.style.top = "-40px";
              }}
            >
              Skip to main content
            </a>
          </div>
        )}
        <WrappedComponent {...(props as P)} />
      </div>
    );
  };

  WithAccessibilityComponent.displayName = `withAccessibility(${componentName})`;

  return WithAccessibilityComponent;
}

/**
 * Decorator for class components
 */
export function accessibilityEnhanced(options?: WithAccessibilityOptions) {
  return function <P extends object>(target: ComponentType<P>) {
    return withAccessibility(target, options);
  };
}

/**
 * Hook for adding accessibility features to functional components
 */
export function useAccessibilityEnhancement(
  options: WithAccessibilityOptions = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { announceToScreenReader, isScreenReaderActive } = useAccessibility();
  const focusManager = getFocusManager();

  const {
    componentName = "Component",
    announceOnMount = false,
    autoFocus = false,
    keyboardNavigation = false,
    shortcuts = {},
  } = options;

  useEffect(() => {
    if (announceOnMount && isScreenReaderActive) {
      announceToScreenReader(`${componentName} loaded`);
    }

    if (autoFocus && containerRef.current) {
      const focusableElements = focusManager.getFocusableElements(
        containerRef.current
      );
      if (focusableElements.length > 0) {
        focusManager.setFocus(focusableElements[0]);
      }
    }
  }, [
    announceToScreenReader,
    isScreenReaderActive,
    componentName,
    announceOnMount,
    autoFocus,
    focusManager,
  ]);

  const accessibilityProps = {
    ref: containerRef,
    tabIndex: keyboardNavigation ? 0 : undefined,
    onKeyDown: keyboardNavigation
      ? (event: React.KeyboardEvent) => {
          // Handle custom shortcuts
          const shortcutKey = `${event.ctrlKey ? "Ctrl+" : ""}${event.altKey ? "Alt+" : ""}${event.shiftKey ? "Shift+" : ""}${event.key}`;

          if (shortcuts[shortcutKey]) {
            event.preventDefault();
            shortcuts[shortcutKey]();
          }
        }
      : undefined,
  };

  return {
    containerRef,
    accessibilityProps,
    announceToScreenReader,
    focusManager,
  };
}

export default withAccessibility;
