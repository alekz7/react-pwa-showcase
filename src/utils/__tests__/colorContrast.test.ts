import { describe, it, expect, beforeEach, vi } from "vitest";
import ColorContrastAnalyzer, {
  getColorContrastAnalyzer,
} from "../colorContrast";

describe("ColorContrastAnalyzer", () => {
  let analyzer: ColorContrastAnalyzer;

  beforeEach(() => {
    analyzer = new ColorContrastAnalyzer();
  });

  describe("color parsing", () => {
    it("parses hex colors correctly", () => {
      const result = analyzer.hexToRgb("#FF0000");
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("parses hex colors without hash", () => {
      const result = analyzer.hexToRgb("00FF00");
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it("parses RGB strings correctly", () => {
      const result = analyzer.rgbStringToRgb("rgb(255, 0, 0)");
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("parses RGBA strings correctly", () => {
      const result = analyzer.rgbaStringToRgb("rgba(255, 0, 0, 0.5)");
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("returns null for invalid hex colors", () => {
      const result = analyzer.hexToRgb("invalid");
      expect(result).toBeNull();
    });

    it("returns null for invalid RGB strings", () => {
      const result = analyzer.rgbStringToRgb("invalid");
      expect(result).toBeNull();
    });
  });

  describe("luminance calculation", () => {
    it("calculates luminance for white correctly", () => {
      const white = { r: 255, g: 255, b: 255 };
      const luminance = analyzer.getRelativeLuminance(white);
      expect(luminance).toBeCloseTo(1, 2);
    });

    it("calculates luminance for black correctly", () => {
      const black = { r: 0, g: 0, b: 0 };
      const luminance = analyzer.getRelativeLuminance(black);
      expect(luminance).toBeCloseTo(0, 2);
    });

    it("calculates luminance for red correctly", () => {
      const red = { r: 255, g: 0, b: 0 };
      const luminance = analyzer.getRelativeLuminance(red);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe("contrast ratio calculation", () => {
    it("calculates maximum contrast ratio for black and white", () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      const ratio = analyzer.getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it("calculates minimum contrast ratio for identical colors", () => {
      const color = { r: 128, g: 128, b: 128 };
      const ratio = analyzer.getContrastRatio(color, color);
      expect(ratio).toBeCloseTo(1, 2);
    });

    it("calculates contrast ratio consistently regardless of order", () => {
      const color1 = { r: 255, g: 0, b: 0 };
      const color2 = { r: 0, g: 255, b: 0 };
      const ratio1 = analyzer.getContrastRatio(color1, color2);
      const ratio2 = analyzer.getContrastRatio(color2, color1);
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });
  });

  describe("text size detection", () => {
    it("identifies large text correctly", () => {
      expect(analyzer.isLargeText(24, 400)).toBe(true); // 24px normal
      expect(analyzer.isLargeText(18.66, 700)).toBe(true); // 18.66px bold
      expect(analyzer.isLargeText(16, 400)).toBe(false); // 16px normal
      expect(analyzer.isLargeText(18, 400)).toBe(false); // 18px normal (not bold)
    });

    it("handles string font weights", () => {
      expect(analyzer.isLargeText(18.66, "bold")).toBe(true);
      expect(analyzer.isLargeText(18.66, "normal")).toBe(false);
      expect(analyzer.isLargeText(18.66, "700")).toBe(true);
    });
  });

  describe("contrast analysis", () => {
    it("analyzes high contrast correctly", () => {
      const result = analyzer.analyzeContrast("#000000", "#FFFFFF");

      expect(result).not.toBeNull();
      expect(result!.ratio).toBeCloseTo(21, 0);
      expect(result!.level).toBe("AAA");
      expect(result!.passes.AA).toBe(true);
      expect(result!.passes.AAA).toBe(true);
    });

    it("analyzes low contrast correctly", () => {
      const result = analyzer.analyzeContrast("#888888", "#999999");

      expect(result).not.toBeNull();
      expect(result!.ratio).toBeLessThan(4.5);
      expect(result!.level).toBe("FAIL");
      expect(result!.passes.AA).toBe(false);
      expect(result!.passes.AAA).toBe(false);
    });

    it("applies different thresholds for large text", () => {
      const result = analyzer.analyzeContrast("#666666", "#FFFFFF", 24, 400);

      expect(result).not.toBeNull();
      expect(result!.isLargeText).toBe(true);
      // Large text has lower threshold requirements
    });

    it("returns null for invalid colors", () => {
      const result = analyzer.analyzeContrast("invalid", "#FFFFFF");
      expect(result).toBeNull();
    });
  });

  describe("page audit", () => {
    beforeEach(() => {
      // Mock DOM methods
      Object.defineProperty(document, "querySelectorAll", {
        value: vi.fn(),
        writable: true,
      });

      Object.defineProperty(window, "getComputedStyle", {
        value: vi.fn(),
        writable: true,
      });
    });

    it("audits page elements for contrast issues", () => {
      const mockElement = {
        textContent: "Sample text",
        tagName: "P",
        id: "test-element",
        className: "test-class",
      };

      (document.querySelectorAll as any).mockReturnValue([mockElement]);
      (window.getComputedStyle as any).mockReturnValue({
        color: "rgb(128, 128, 128)",
        backgroundColor: "rgb(255, 255, 255)",
        fontSize: "16px",
        fontWeight: "400",
      });

      const results = analyzer.auditPageContrast();

      expect(Array.isArray(results)).toBe(true);
      // Results depend on the actual contrast calculation
    });

    it("skips elements without text content", () => {
      const mockElement = {
        textContent: "",
        tagName: "DIV",
      };

      (document.querySelectorAll as any).mockReturnValue([mockElement]);

      const results = analyzer.auditPageContrast();
      expect(results).toHaveLength(0);
    });

    it("skips elements with transparent backgrounds", () => {
      const mockElement = {
        textContent: "Sample text",
        tagName: "P",
      };

      (document.querySelectorAll as any).mockReturnValue([mockElement]);
      (window.getComputedStyle as any).mockReturnValue({
        color: "rgb(0, 0, 0)",
        backgroundColor: "rgba(0, 0, 0, 0)",
        fontSize: "16px",
        fontWeight: "400",
      });

      const results = analyzer.auditPageContrast();
      expect(results).toHaveLength(0);
    });
  });

  describe("color suggestions", () => {
    it("suggests better colors for improved contrast", () => {
      const result = analyzer.suggestBetterColors(
        "#888888",
        "#999999",
        "AA",
        false
      );

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("foreground");
      expect(result).toHaveProperty("background");
    });

    it("returns null for invalid colors", () => {
      const result = analyzer.suggestBetterColors("invalid", "#FFFFFF");
      expect(result).toBeNull();
    });
  });

  describe("singleton pattern", () => {
    it("returns same instance from getColorContrastAnalyzer", () => {
      const instance1 = getColorContrastAnalyzer();
      const instance2 = getColorContrastAnalyzer();

      expect(instance1).toBe(instance2);
    });
  });
});
