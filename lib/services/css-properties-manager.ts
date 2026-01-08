/**
 * CSS Custom Properties Manager
 * 
 * Manages dynamic CSS custom properties for tenant branding.
 * Extends existing theme system with tenant-specific customizations.
 */

import type { 
  ColorPalette, 
  FontScheme, 
  CSSCustomProperties,
  CompleteBrandingConfig 
} from '@/types/brand-customization';

export class CSSPropertiesManager {
  private static instance: CSSPropertiesManager;
  private root: HTMLElement;
  private appliedProperties: Set<string> = new Set();

  private constructor() {
    this.root = document.documentElement;
  }

  public static getInstance(): CSSPropertiesManager {
    if (!CSSPropertiesManager.instance) {
      CSSPropertiesManager.instance = new CSSPropertiesManager();
    }
    return CSSPropertiesManager.instance;
  }

  /**
   * Apply complete branding configuration to CSS custom properties
   */
  public applyBrandingConfiguration(branding: CompleteBrandingConfig): void {
    // Apply color palette if available
    if (branding.colorPalette) {
      this.applyColorPalette(branding.colorPalette);
    }

    // Apply font scheme if available
    if (branding.fontScheme) {
      this.applyFontScheme(branding.fontScheme);
    }

    // Apply custom CSS if available
    if (branding.tenantBranding.customCss) {
      this.applyCustomCSS(branding.tenantBranding.customCss);
    }
  }

  /**
   * Apply color palette to CSS custom properties
   */
  public applyColorPalette(palette: ColorPalette): void {
    const colorProperties: Partial<CSSCustomProperties> = {
      '--primary': palette.primaryColor,
      '--primary-foreground': palette.primaryForeground,
      '--secondary': palette.secondaryColor,
      '--secondary-foreground': palette.secondaryForeground,
      '--accent': palette.accentColor,
      '--accent-foreground': palette.accentForeground,
      '--muted': palette.mutedColor,
      '--muted-foreground': palette.mutedForeground,
      '--background': palette.backgroundColor,
      '--foreground': palette.foregroundColor,
      '--card': palette.cardColor,
      '--card-foreground': palette.cardForeground,
      '--destructive': palette.destructiveColor,
      '--destructive-foreground': palette.destructiveForeground,
      '--sidebar-background': palette.sidebarBackground,
      '--sidebar-foreground': palette.sidebarForeground,
      '--sidebar-primary': palette.sidebarPrimary,
      '--sidebar-primary-foreground': palette.sidebarPrimaryForeground,
    };

    this.setProperties(colorProperties);
  }

  /**
   * Apply font scheme to CSS custom properties
   */
  public applyFontScheme(fontScheme: FontScheme): void {
    const fontProperties: Partial<CSSCustomProperties> = {
      '--font-sans': fontScheme.fontSans.join(', '),
      '--font-mono': fontScheme.fontMono.join(', '),
    };

    this.setProperties(fontProperties);

    // Load Google Fonts if needed
    if (fontScheme.googleFonts.length > 0) {
      this.loadGoogleFonts(fontScheme.googleFonts);
    }

    // Apply font sizes and weights
    this.applyFontSizes(fontScheme.fontSizes);
    this.applyFontWeights(fontScheme.fontWeights);
  }

  /**
   * Apply custom CSS styles
   */
  public applyCustomCSS(customCss: string): void {
    // Remove existing custom CSS
    const existingStyle = document.querySelector('style[data-tenant-custom-css]');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS
    if (customCss.trim()) {
      const style = document.createElement('style');
      style.setAttribute('data-tenant-custom-css', 'true');
      style.textContent = customCss;
      document.head.appendChild(style);
    }
  }

  /**
   * Reset all tenant-specific CSS properties to defaults
   */
  public resetToDefaults(): void {
    // Remove all applied properties
    this.appliedProperties.forEach(property => {
      this.root.style.removeProperty(property);
    });
    this.appliedProperties.clear();

    // Remove custom CSS
    const customStyle = document.querySelector('style[data-tenant-custom-css]');
    if (customStyle) {
      customStyle.remove();
    }

    // Remove Google Fonts
    const googleFontsLink = document.querySelector('link[data-google-fonts]');
    if (googleFontsLink) {
      googleFontsLink.remove();
    }
  }

  /**
   * Get current CSS property value
   */
  public getProperty(property: string): string {
    return getComputedStyle(this.root).getPropertyValue(property);
  }

  /**
   * Check if a property has been applied by tenant branding
   */
  public isPropertyApplied(property: string): boolean {
    return this.appliedProperties.has(property);
  }

  /**
   * Get all applied tenant properties
   */
  public getAppliedProperties(): string[] {
    return Array.from(this.appliedProperties);
  }

  /**
   * Apply theme customizer properties (radius, scale)
   */
  public applyThemeCustomizerProperties(radius: number, scale: number): void {
    const properties = {
      '--radius': `${radius}rem`,
      '--scale': scale.toString(),
    };

    this.setProperties(properties);
  }

  /**
   * Apply dark/light mode
   */
  public applyThemeMode(mode: 'light' | 'dark'): void {
    if (mode === 'dark') {
      this.root.classList.add('dark');
    } else {
      this.root.classList.remove('dark');
    }
  }

  /**
   * Private method to set CSS properties
   */
  private setProperties(properties: Record<string, string>): void {
    Object.entries(properties).forEach(([property, value]) => {
      if (value) {
        this.root.style.setProperty(property, value);
        this.appliedProperties.add(property);
      }
    });
  }

  /**
   * Apply font sizes to CSS custom properties
   */
  private applyFontSizes(fontSizes: FontScheme['fontSizes']): void {
    const sizeProperties: Record<string, string> = {};
    
    Object.entries(fontSizes).forEach(([size, value]) => {
      sizeProperties[`--font-size-${size}`] = value;
    });

    this.setProperties(sizeProperties);
  }

  /**
   * Apply font weights to CSS custom properties
   */
  private applyFontWeights(fontWeights: FontScheme['fontWeights']): void {
    const weightProperties: Record<string, string> = {};
    
    Object.entries(fontWeights).forEach(([weight, value]) => {
      weightProperties[`--font-weight-${weight}`] = value.toString();
    });

    this.setProperties(weightProperties);
  }

  /**
   * Load Google Fonts dynamically
   */
  private loadGoogleFonts(fonts: string[]): void {
    // Remove existing Google Fonts link
    const existingLink = document.querySelector('link[data-google-fonts]');
    if (existingLink) {
      existingLink.remove();
    }

    if (fonts.length === 0) return;

    // Create new Google Fonts link
    const fontFamilies = fonts
      .map(font => font.replace(/\s+/g, '+'))
      .join('&family=');
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    link.setAttribute('data-google-fonts', 'true');
    document.head.appendChild(link);
  }
}

/**
 * Utility functions for CSS properties management
 */

/**
 * Convert color palette to CSS custom properties object
 */
export function colorPaletteToCSSProperties(palette: ColorPalette): Partial<CSSCustomProperties> {
  return {
    '--primary': palette.primaryColor,
    '--primary-foreground': palette.primaryForeground,
    '--secondary': palette.secondaryColor,
    '--secondary-foreground': palette.secondaryForeground,
    '--accent': palette.accentColor,
    '--accent-foreground': palette.accentForeground,
    '--muted': palette.mutedColor,
    '--muted-foreground': palette.mutedForeground,
    '--background': palette.backgroundColor,
    '--foreground': palette.foregroundColor,
    '--card': palette.cardColor,
    '--card-foreground': palette.cardForeground,
    '--destructive': palette.destructiveColor,
    '--destructive-foreground': palette.destructiveForeground,
    '--sidebar-background': palette.sidebarBackground,
    '--sidebar-foreground': palette.sidebarForeground,
    '--sidebar-primary': palette.sidebarPrimary,
    '--sidebar-primary-foreground': palette.sidebarPrimaryForeground,
  };
}

/**
 * Convert font scheme to CSS custom properties object
 */
export function fontSchemeToCSSProperties(fontScheme: FontScheme): Partial<CSSCustomProperties> {
  return {
    '--font-sans': fontScheme.fontSans.join(', '),
    '--font-mono': fontScheme.fontMono.join(', '),
  };
}

/**
 * Validate CSS property name
 */
export function isValidCSSProperty(property: string): boolean {
  return property.startsWith('--') && property.length > 2;
}

/**
 * Validate CSS property value
 */
export function isValidCSSValue(value: string): boolean {
  // Basic validation - not empty and doesn't contain dangerous characters
  return value.trim().length > 0 && !value.includes('<script>');
}

/**
 * Get singleton instance of CSS Properties Manager
 */
export function getCSSPropertiesManager(): CSSPropertiesManager {
  return CSSPropertiesManager.getInstance();
}