/**
 * Color contrast utilities for accessibility compliance
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  ratio: number;
  level: "AAA" | "AA" | "A" | "FAIL";
  isLargeText: boolean;
  passes: {
    AA: boolean;
    AAA: boolean;
  };
}

export class ColorContrastAnalyzer {
  /**
   * Convert hex color to RGB
   */
  public hexToRgb(hex: string): ColorRGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Convert RGB string to RGB object
   */
  public rgbStringToRgb(rgb: string): ColorRGB | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;

    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  /**
   * Convert RGBA string to RGB object (ignoring alpha)
   */
  public rgbaStringToRgb(rgba: string): ColorRGB | null {
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (!match) return null;

    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  /**
   * Parse any color string to RGB
   */
  public parseColor(color: string): ColorRGB | null {
    if (color.startsWith("#")) {
      return this.hexToRgb(color);
    } else if (color.startsWith("rgb(")) {
      return this.rgbStringToRgb(color);
    } else if (color.startsWith("rgba(")) {
      return this.rgbaStringToRgb(color);
    }
    return null;
  }

  /**
   * Calculate relative luminance of a color
   */
  public getRelativeLuminance(rgb: ColorRGB): number {
    const { r, g, b } = rgb;

    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  public getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if text size is considered large
   */
  public isLargeText(fontSize: number, fontWeight: number | string): boolean {
    const weight =
      typeof fontWeight === "string"
        ? fontWeight === "bold" ||
          fontWeight === "700" ||
          fontWeight === "800" ||
          fontWeight === "900"
          ? 700
          : 400
        : fontWeight;

    // Large text is 18pt (24px) or 14pt (18.66px) bold
    return fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
  }

  /**
   * Analyze contrast between two colors
   */
  public analyzeContrast(
    foreground: string,
    background: string,
    fontSize: number = 16,
    fontWeight: number | string = 400
  ): ContrastResult | null {
    const fgColor = this.parseColor(foreground);
    const bgColor = this.parseColor(background);

    if (!fgColor || !bgColor) return null;

    const ratio = this.getContrastRatio(fgColor, bgColor);
    const isLargeText = this.isLargeText(fontSize, fontWeight);

    // WCAG 2.1 requirements
    const aaThreshold = isLargeText ? 3 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7;

    const passesAA = ratio >= aaThreshold;
    const passesAAA = ratio >= aaaThreshold;

    let level: ContrastResult["level"];
    if (passesAAA) {
      level = "AAA";
    } else if (passesAA) {
      level = "AA";
    } else if (ratio >= 3) {
      level = "A";
    } else {
      level = "FAIL";
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      level,
      isLargeText,
      passes: {
        AA: passesAA,
        AAA: passesAAA,
      },
    };
  }

  /**
   * Audit all text elements on the page for contrast issues
   */
  public auditPageContrast(): Array<{
    element: HTMLElement;
    result: ContrastResult;
    selector: string;
  }> {
    const results: Array<{
      element: HTMLElement;
      result: ContrastResult;
      selector: string;
    }> = [];

    // Get all text-containing elements
    const textElements = document.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, div, a, button, label, input, textarea, select, li, td, th"
    );

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);

      // Skip if element has no text content
      if (!htmlElement.textContent?.trim()) return;

      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;

      // Skip transparent backgrounds - would need to check parent elements
      if (
        backgroundColor === "rgba(0, 0, 0, 0)" ||
        backgroundColor === "transparent"
      )
        return;

      const result = this.analyzeContrast(
        color,
        backgroundColor,
        fontSize,
        fontWeight
      );

      if (result && !result.passes.AA) {
        results.push({
          element: htmlElement,
          result,
          selector: this.getElementSelector(htmlElement),
        });
      }
    });

    return results;
  }

  /**
   * Generate a CSS selector for an element
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(" ").filter((c) => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Suggest better colors for improved contrast
   */
  public suggestBetterColors(
    foreground: string,
    background: string,
    targetLevel: "AA" | "AAA" = "AA",
    isLargeText: boolean = false
  ): { foreground: string; background: string } | null {
    const fgColor = this.parseColor(foreground);
    const bgColor = this.parseColor(background);

    if (!fgColor || !bgColor) return null;

    const targetRatio =
      targetLevel === "AAA" ? (isLargeText ? 4.5 : 7) : isLargeText ? 3 : 4.5;

    // Try darkening the foreground or lightening the background
    const fgLuminance = this.getRelativeLuminance(fgColor);
    const bgLuminance = this.getRelativeLuminance(bgColor);

    if (fgLuminance > bgLuminance) {
      // Light text on dark background - darken the background or lighten the text
      const newBg = this.adjustColorForContrast(
        bgColor,
        fgColor,
        targetRatio,
        "darken"
      );
      return {
        foreground,
        background: this.rgbToHex(newBg),
      };
    } else {
      // Dark text on light background - darken the text or lighten the background
      const newFg = this.adjustColorForContrast(
        fgColor,
        bgColor,
        targetRatio,
        "darken"
      );
      return {
        foreground: this.rgbToHex(newFg),
        background,
      };
    }
  }

  /**
   * Adjust a color to meet contrast requirements
   */
  private adjustColorForContrast(
    colorToAdjust: ColorRGB,
    otherColor: ColorRGB,
    targetRatio: number,
    direction: "lighten" | "darken"
  ): ColorRGB {
    const adjusted = { ...colorToAdjust };
    const step = direction === "darken" ? -5 : 5;

    for (let i = 0; i < 50; i++) {
      const ratio = this.getContrastRatio(adjusted, otherColor);
      if (ratio >= targetRatio) break;

      adjusted.r = Math.max(0, Math.min(255, adjusted.r + step));
      adjusted.g = Math.max(0, Math.min(255, adjusted.g + step));
      adjusted.b = Math.max(0, Math.min(255, adjusted.b + step));
    }

    return adjusted;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(rgb: ColorRGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}

// Singleton instance
let colorContrastAnalyzer: ColorContrastAnalyzer | null = null;

export const getColorContrastAnalyzer = (): ColorContrastAnalyzer => {
  if (!colorContrastAnalyzer) {
    colorContrastAnalyzer = new ColorContrastAnalyzer();
  }
  return colorContrastAnalyzer;
};

export default ColorContrastAnalyzer;
