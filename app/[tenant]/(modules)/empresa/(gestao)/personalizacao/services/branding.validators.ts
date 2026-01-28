import {
  AccessibilityReport,
  ColorValidationError,
  CreateColorPaletteRequest,
  ValidationResult,
} from "./brand-customization.types";

export class BrandingValidators {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "image/webp",
  ];
  private static readonly ALLOWED_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
  ];

  /**
   * Validate logo file for security and format compliance
   */
  static async validateLogo(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
      );
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(
        `File type ${file.type} is not supported. Allowed types: ${this.ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext),
    );
    if (!hasValidExtension) {
      errors.push(
        `File extension is not supported. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(", ")}`,
      );
    }

    // Check for potentially malicious filenames
    if (this.hasMaliciousFileName(file.name)) {
      errors.push("Filename contains potentially unsafe characters");
    }

    // Validate file content (basic checks)
    try {
      await this.validateFileContent(file);
    } catch (error) {
      errors.push(
        `File content validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Size warnings
    if (file.size > 1024 * 1024) {
      // 1MB
      warnings.push("Large file size may impact loading performance");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate color format (hex, hsl, rgb)
   */
  static validateColorFormat(color: string): boolean {
    if (!color || typeof color !== "string") {
      return false;
    }

    // Hex format: #000000 or #000
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(color)) {
      return true;
    }

    // HSL format: hsl(0, 0%, 0%) or hsl(0 0% 0%)
    const hslRegex =
      /^hsl\(\s*\d+(\.\d+)?\s*,?\s*\d+(\.\d+)?%\s*,?\s*\d+(\.\d+)?%\s*\)$/i;
    if (hslRegex.test(color)) {
      return true;
    }

    // RGB format: rgb(0, 0, 0) or rgb(0 0 0)
    const rgbRegex = /^rgb\(\s*\d+\s*,?\s*\d+\s*,?\s*\d+\s*\)$/i;
    if (rgbRegex.test(color)) {
      return true;
    }

    // RGBA format: rgba(0, 0, 0, 0.5)
    const rgbaRegex =
      /^rgba\(\s*\d+\s*,?\s*\d+\s*,?\s*\d+\s*,?\s*(0|1|0?\.\d+)\s*\)$/i;
    if (rgbaRegex.test(color)) {
      return true;
    }

    // HSLA format: hsla(0, 0%, 0%, 0.5)
    const hslaRegex =
      /^hsla\(\s*\d+(\.\d+)?\s*,?\s*\d+(\.\d+)?%\s*,?\s*\d+(\.\d+)?%\s*,?\s*(0|1|0?\.\d+)\s*\)$/i;
    if (hslaRegex.test(color)) {
      return true;
    }

    return false;
  }

  /**
   * Validate color contrast for accessibility compliance
   */
  static validateColorContrast(
    palette: CreateColorPaletteRequest,
  ): AccessibilityReport {
    try {
      // Calculate contrast ratios for key color combinations
      const primaryOnBackground = this.calculateContrastRatio(
        palette.primaryColor,
        palette.backgroundColor,
      );
      const secondaryOnBackground = this.calculateContrastRatio(
        palette.secondaryColor,
        palette.backgroundColor,
      );
      const accentOnBackground = this.calculateContrastRatio(
        palette.accentColor,
        palette.backgroundColor,
      );

      // WCAG AA compliance requires 4.5:1 for normal text, 3:1 for large text
      const minContrastRatio = 4.5;
      const isCompliant =
        primaryOnBackground >= minContrastRatio &&
        secondaryOnBackground >= minContrastRatio &&
        accentOnBackground >= minContrastRatio;

      const recommendations: string[] = [];
      const warnings: string[] = [];

      if (primaryOnBackground < minContrastRatio) {
        recommendations.push(
          `Primary color contrast ratio (${primaryOnBackground.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        );
      }

      if (secondaryOnBackground < minContrastRatio) {
        recommendations.push(
          `Secondary color contrast ratio (${secondaryOnBackground.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        );
      }

      if (accentOnBackground < minContrastRatio) {
        recommendations.push(
          `Accent color contrast ratio (${accentOnBackground.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        );
      }

      // Add warnings for borderline cases
      if (primaryOnBackground >= minContrastRatio && primaryOnBackground < 7) {
        warnings.push(
          "Primary color meets AA but not AAA accessibility standards",
        );
      }

      return {
        isCompliant,
        contrastRatios: {
          primaryOnBackground,
          secondaryOnBackground,
          accentOnBackground,
        },
        recommendations:
          recommendations.length > 0 ? recommendations : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      throw new ColorValidationError(
        `Failed to validate color contrast: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Private helper methods

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private static hasMaliciousFileName(fileName: string): boolean {
    const maliciousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Windows invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./, // Hidden files
      /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable extensions
    ];

    return maliciousPatterns.some((pattern) => pattern.test(fileName));
  }

  private static async validateFileContent(file: File): Promise<void> {
    // Basic file header validation
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 16));

    // Check for common image file signatures
    const signatures = {
      png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      jpeg: [0xff, 0xd8, 0xff],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
      svg: [0x3c], // < character (XML start)
    };

    const isPNG = signatures.png.every((byte, i) => bytes[i] === byte);
    const isJPEG = signatures.jpeg.every((byte, i) => bytes[i] === byte);
    const isWEBP = signatures.webp.every((byte, i) => bytes[i] === byte);
    const isSVG =
      bytes[0] === signatures.svg[0] || file.type === "image/svg+xml";

    if (!isPNG && !isJPEG && !isWEBP && !isSVG) {
      throw new Error("File content does not match expected image format");
    }
  }

  private static calculateContrastRatio(
    color1: string,
    color2: string,
  ): number {
    try {
      const luminance1 = this.getLuminance(color1);
      const luminance2 = this.getLuminance(color2);

      const lighter = Math.max(luminance1, luminance2);
      const darker = Math.min(luminance1, luminance2);

      return (lighter + 0.05) / (darker + 0.05);
    } catch (_error) {
      // Return minimum contrast ratio if calculation fails
      return 1;
    }
  }

  private static getLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const [r, g, b] = rgb.map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private static parseColor(color: string): [number, number, number] | null {
    // Handle hex colors
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16),
        ];
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }

    // Handle HSL colors - simplified conversion
    if (color.startsWith("hsl")) {
      const match = color.match(
        /hsl\(\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)%\s*,?\s*(\d+(?:\.\d+)?)%\s*\)/i,
      );
      if (match) {
        const h = parseFloat(match[1]) / 360;
        const s = parseFloat(match[2]) / 100;
        const l = parseFloat(match[3]) / 100;

        return this.hslToRgb(h, s, l);
      }
    }

    // Handle RGB colors
    if (color.startsWith("rgb")) {
      const match = color.match(
        /rgba?\(\s*(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\s*(?:,?\s*[\d.]+)?\s*\)/i,
      );
      if (match) {
        return [
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
        ];
      }
    }

    return null;
  }

  private static hslToRgb(
    h: number,
    s: number,
    l: number,
  ): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}
