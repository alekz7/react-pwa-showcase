import { useState, useEffect, useCallback } from "react";
import { getAccessibilityService } from "../services/accessibilityService";
import type {
  AccessibilityFeatures,
  AccessibilityAudit,
} from "../services/accessibilityService";

export interface UseAccessibilityReturn {
  features: AccessibilityFeatures;
  audit: AccessibilityAudit | null;
  isScreenReaderActive: boolean;
  isHighContrastMode: boolean;
  isReducedMotionPreferred: boolean;
  isKeyboardNavigating: boolean;
  runAudit: () => void;
  announceToScreenReader: (message: string) => void;
  setFocusToElement: (elementId: string) => void;
  skipToContent: () => void;
}

export const useAccessibility = (): UseAccessibilityReturn => {
  const [features, setFeatures] = useState<AccessibilityFeatures>({
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    keyboardNavigation: false,
    focusVisible: false,
  });

  const [audit, setAudit] = useState<AccessibilityAudit | null>(null);

  const runAudit = useCallback(() => {
    const service = getAccessibilityService();
    const auditResult = service.auditPage();
    setAudit(auditResult);
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    // Create a live region for screen reader announcements
    let liveRegion = document.getElementById("sr-live-region");

    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "sr-live-region";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";
      document.body.appendChild(liveRegion);
    }

    // Clear and set the message
    liveRegion.textContent = "";
    setTimeout(() => {
      liveRegion!.textContent = message;
    }, 100);
  }, []);

  const setFocusToElement = useCallback(
    (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();

        // Announce focus change to screen readers
        const elementText =
          element.textContent ||
          element.getAttribute("aria-label") ||
          "Element";
        announceToScreenReader(`Focus moved to ${elementText}`);
      }
    },
    [announceToScreenReader]
  );

  const skipToContent = useCallback(() => {
    const mainContent =
      document.getElementById("main-content") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]');

    if (mainContent) {
      mainContent.focus();
      announceToScreenReader("Skipped to main content");
    }
  }, [announceToScreenReader]);
  useEffect(() => {
    const service = getAccessibilityService();

    // Subscribe to accessibility feature changes
    const unsubscribe = service.subscribe((newFeatures) => {
      setFeatures(newFeatures);
    });

    // Run initial audit
    runAudit();

    // Set up keyboard event listeners for accessibility shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + 1: Skip to main content
      if (event.altKey && event.key === "1") {
        event.preventDefault();
        skipToContent();
      }

      // Alt + 2: Skip to navigation
      if (event.altKey && event.key === "2") {
        event.preventDefault();
        const nav =
          document.querySelector("nav") ||
          document.querySelector('[role="navigation"]');
        if (nav) {
          (nav as HTMLElement).focus();
          announceToScreenReader("Skipped to navigation");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unsubscribe();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [runAudit, skipToContent, announceToScreenReader]);

  return {
    features,
    audit,
    isScreenReaderActive: features.screenReader,
    isHighContrastMode: features.highContrast,
    isReducedMotionPreferred: features.reducedMotion,
    isKeyboardNavigating: features.keyboardNavigation,
    runAudit,
    announceToScreenReader,
    setFocusToElement,
    skipToContent,
  };
};

export default useAccessibility;
