/**
 * Aluminify Design System - Brand Customization Mapping
 *
 * Maps ColorPalette and FontScheme database fields to CSS custom properties.
 * Used by TenantBrandingProvider and CSSPropertiesManager.
 */

import type { ColorPalette, FontScheme } from '@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization.types';

/**
 * Maps ColorPalette fields to CSS variable names
 */
export const colorPaletteMapping = {
  primaryColor: '--primary',
  primaryForeground: '--primary-foreground',
  secondaryColor: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accentColor: '--accent',
  accentForeground: '--accent-foreground',
  mutedColor: '--muted',
  mutedForeground: '--muted-foreground',
  backgroundColor: '--background',
  foregroundColor: '--foreground',
  cardColor: '--card',
  cardForeground: '--card-foreground',
  destructiveColor: '--destructive',
  destructiveForeground: '--destructive-foreground',
  sidebarBackground: '--sidebar',
  sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary',
  sidebarPrimaryForeground: '--sidebar-primary-foreground',
} as const;

/**
 * Converts a ColorPalette to CSS custom properties object
 */
export function colorPaletteToCSS(palette: ColorPalette): Record<string, string> {
  const cssVars: Record<string, string> = {};

  for (const [field, cssVar] of Object.entries(colorPaletteMapping)) {
    const value = palette[field as keyof ColorPalette];
    if (typeof value === 'string' && value) {
      cssVars[cssVar] = value;
    }
  }

  return cssVars;
}

/**
 * Converts a FontScheme to CSS custom properties object
 */
export function fontSchemeToCSS(scheme: FontScheme): Record<string, string> {
  const cssVars: Record<string, string> = {
    '--font-sans': scheme.fontSans.join(', '),
    '--font-mono': scheme.fontMono.join(', '),
  };

  // Add font sizes if specified
  if (scheme.fontSizes) {
    for (const [size, value] of Object.entries(scheme.fontSizes)) {
      cssVars[`--font-size-${size}`] = value;
    }
  }

  // Add font weights if specified
  if (scheme.fontWeights) {
    for (const [weight, value] of Object.entries(scheme.fontWeights)) {
      cssVars[`--font-weight-${weight}`] = String(value);
    }
  }

  return cssVars;
}

/**
 * List of all CSS variables that can be customized by tenants
 */
export const customizableCSSVariables = [
  // Colors
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--muted',
  '--muted-foreground',
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--destructive',
  '--destructive-foreground',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  // Typography
  '--font-sans',
  '--font-mono',
  // Theme customizer
  '--radius',
] as const;
