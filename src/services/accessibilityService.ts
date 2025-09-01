/**
 * Accessibility service for managing and monitoring accessibility features
 */

export interface AccessibilityFeatures {
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

export interface AccessibilityAudit {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagLevel: "A" | "AA" | "AAA";
}

export interface AccessibilityIssue {
  type: "error" | "warning" | "info";
  severity: "critical" | "serious" | "moderate" | "minor";
  element?: HTMLElement;
  message: string;
  wcagCriterion?: string;
  suggestion?: string;
}

class AccessibilityService {
  private features: AccessibilityFeatures;
  private observers: MutationObserver[] = [];
  private listeners: ((features: AccessibilityFeatures) => void)[] = [];

  constructor() {
    this.features = this.detectAccessibilityFeatures();
    this.initializeObservers();
    this.setupEventListeners();
  }

  private detectAccessibilityFeatures(): AccessibilityFeatures {
    return {
      screenReader: this.detectScreenReader(),
      highContrast: this.detectHighContrast(),
      reducedMotion: this.detectReducedMotion(),
      keyboardNavigation: this.detectKeyboardNavigation(),
      focusVisible: this.detectFocusVisible(),
    };
  }

  private detectScreenReader(): boolean {
    // Check for screen reader indicators
    if (typeof window === "undefined") return false;

    // Check for NVDA, JAWS, VoiceOver, etc.
    const userAgent = navigator.userAgent.toLowerCase();
    const hasScreenReaderUA = /nvda|jaws|voiceover|talkback/.test(userAgent);

    // Check for screen reader specific APIs
    const hasScreenReaderAPI =
      !!window.speechSynthesis ||
      !!(window as unknown as { SpeechSynthesisUtterance?: unknown })
        .SpeechSynthesisUtterance;

    return hasScreenReaderUA || hasScreenReaderAPI;
  }

  private detectHighContrast(): boolean {
    if (typeof window === "undefined") return false;

    // Check for high contrast mode
    return (
      window.matchMedia("(prefers-contrast: high)").matches ||
      window.matchMedia("(-ms-high-contrast: active)").matches
    );
  }

  private detectReducedMotion(): boolean {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private detectKeyboardNavigation(): boolean {
    // This will be updated when keyboard navigation is detected
    return false;
  }

  private detectFocusVisible(): boolean {
    if (typeof window === "undefined") return false;

    // Check if focus-visible is supported
    try {
      document.querySelector(":focus-visible");
      return true;
    } catch {
      return false;
    }
  }

  private initializeObservers(): void {
    if (typeof window === "undefined") return;

    // Observe DOM changes for accessibility issues
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    // Listen for keyboard navigation
    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        this.features.keyboardNavigation = true;
        this.notifyListeners();
      }
    });

    // Listen for media query changes
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    highContrastQuery.addEventListener("change", (e) => {
      this.features.highContrast = e.matches;
      this.notifyListeners();
    });

    reducedMotionQuery.addEventListener("change", (e) => {
      this.features.reducedMotion = e.matches;
      this.notifyListeners();
    });
  }

  private auditElement(element: HTMLElement): void {
    // Basic accessibility audit for new elements
    this.checkAriaLabels(element);
    this.checkColorContrast(element);
    this.checkFocusability(element);
  }

  private checkAriaLabels(element: HTMLElement): void {
    // Check for missing ARIA labels on interactive elements
    const interactiveElements = ["button", "input", "select", "textarea", "a"];

    if (interactiveElements.includes(element.tagName.toLowerCase())) {
      const hasLabel =
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby") ||
        element.textContent?.trim() ||
        element.querySelector("label");

      if (!hasLabel) {
        console.warn(
          "Accessibility: Interactive element missing label",
          element
        );
      }
    }
  }

  private checkColorContrast(element: HTMLElement): void {
    // Basic color contrast check
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    if (
      color &&
      backgroundColor &&
      color !== "rgba(0, 0, 0, 0)" &&
      backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      // This is a simplified check - in production, you'd use a proper contrast ratio calculator
      const contrast = this.calculateContrastRatio();
      if (contrast < 4.5) {
        console.warn("Accessibility: Low color contrast detected", element, {
          contrast,
        });
      }
    }
  }

  private checkFocusability(element: HTMLElement): void {
    // Check if interactive elements are focusable
    const interactiveElements = ["button", "input", "select", "textarea", "a"];

    if (interactiveElements.includes(element.tagName.toLowerCase())) {
      const tabIndex = element.getAttribute("tabindex");
      const isDisabled = element.hasAttribute("disabled");

      if (tabIndex === "-1" && !isDisabled) {
        console.warn(
          "Accessibility: Interactive element not focusable",
          element
        );
      }
    }
  }

  private calculateContrastRatio(): number {
    // Simplified contrast ratio calculation
    // In production, use a proper color contrast library
    return 4.5; // Placeholder
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.features));
  }

  public getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  public subscribe(
    listener: (features: AccessibilityFeatures) => void
  ): () => void {
    this.listeners.push(listener);

    // Send current features immediately
    listener(this.features);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public auditPage(): AccessibilityAudit {
    const issues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    document.querySelectorAll("img").forEach((img) => {
      if (!img.alt && !img.getAttribute("aria-label")) {
        issues.push({
          type: "error",
          severity: "serious",
          element: img,
          message: "Image missing alt text",
          wcagCriterion: "1.1.1",
          suggestion: "Add descriptive alt text or aria-label",
        });
      }
    });

    // Check for missing form labels
    document.querySelectorAll("input, select, textarea").forEach((input) => {
      const hasLabel =
        input.getAttribute("aria-label") ||
        input.getAttribute("aria-labelledby") ||
        document.querySelector(`label[for="${input.id}"]`);

      if (!hasLabel) {
        issues.push({
          type: "error",
          severity: "serious",
          element: input as HTMLElement,
          message: "Form control missing label",
          wcagCriterion: "1.3.1",
          suggestion: "Add label element or aria-label attribute",
        });
      }
    });

    // Check for heading hierarchy
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push({
          type: "warning",
          severity: "moderate",
          element: heading as HTMLElement,
          message: "Heading level skipped",
          wcagCriterion: "1.3.1",
          suggestion: "Use proper heading hierarchy",
        });
      }
      previousLevel = level;
    });

    const score = Math.max(0, 100 - issues.length * 10);
    const wcagLevel = score >= 90 ? "AAA" : score >= 70 ? "AA" : "A";

    return {
      score,
      issues,
      recommendations: this.generateRecommendations(issues),
      wcagLevel,
    };
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some((issue) => issue.message.includes("alt text"))) {
      recommendations.push("Add descriptive alt text to all images");
    }

    if (issues.some((issue) => issue.message.includes("label"))) {
      recommendations.push("Ensure all form controls have proper labels");
    }

    if (issues.some((issue) => issue.message.includes("contrast"))) {
      recommendations.push("Improve color contrast ratios");
    }

    if (issues.some((issue) => issue.message.includes("heading"))) {
      recommendations.push("Use proper heading hierarchy");
    }

    return recommendations;
  }

  public destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.listeners = [];
  }
}

// Singleton instance
let accessibilityService: AccessibilityService | null = null;

export const getAccessibilityService = (): AccessibilityService => {
  if (!accessibilityService) {
    accessibilityService = new AccessibilityService();
  }
  return accessibilityService;
};

export default AccessibilityService;
