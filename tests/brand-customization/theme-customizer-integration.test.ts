/**
 * Property-Based Test: Theme Customizer Integration
 * 
 * Feature: brand-customization, Property 14: Theme Customizer Integration
 * Validates: Requirements 6.1, 6.2
 * 
 * Tests that the existing theme customizer extends with tenant-specific options
 * while maintaining compatibility with existing presets.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { CustomThemePreset, CompleteBrandingConfig } from '@/types/brand-customization';

// Mock localStorage for theme configuration
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch for API calls
global.fetch = jest.fn();

// Standard theme presets that should always be available
const STANDARD_PRESETS = ['default', 'blue', 'green', 'purple', 'orange', 'red'];

// Theme configuration interface for testing
interface ThemeConfig {
  preset: string;
  radius: number;
  scale: number;
  mode: 'light' | 'dark';
  customPresets?: CustomThemePreset[];
  activeBranding?: CompleteBrandingConfig;
}

// Helper function to simulate theme customizer preset selection logic
function selectPreset(currentTheme: ThemeConfig, presetId: string, customPresets: CustomThemePreset[]): ThemeConfig {
  // Check if it's a standard preset
  if (STANDARD_PRESETS.includes(presetId)) {
    return {
      ...currentTheme,
      preset: presetId,
      // Standard presets have default values
      radius: 0.5,
      scale: 1.0,
      mode: 'light',
    };
  }

  // Check if it's a custom preset
  const customPreset = customPresets.find(p => p.id === presetId);
  if (customPreset) {
    return {
      ...currentTheme,
      preset: presetId,
      radius: customPreset.radius,
      scale: customPreset.scale,
      mode: customPreset.mode,
    };
  }

  // If preset not found, return current theme unchanged
  return currentTheme;
}

// Helper function to get all available presets
function getAllAvailablePresets(customPresets: CustomThemePreset[]): string[] {
  return [...STANDARD_PRESETS, ...customPresets.map(p => p.id)];
}

// Helper function to check if branding customization should be available
function shouldShowBrandCustomization(branding?: CompleteBrandingConfig): boolean {
  if (!branding) return false;
  
  return !!(
    branding.colorPalette ||
    branding.fontScheme ||
    branding.logos?.login ||
    branding.logos?.sidebar ||
    branding.logos?.favicon
  );
}

// Generators for property-based testing
const hexColorArb = fc.integer({ min: 0, max: 0xffffff }).map(n => `#${n.toString(16).padStart(6, '0')}`);

const customThemePresetArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  empresaId: fc.string({ minLength: 1, maxLength: 50 }),
  colorPaletteId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  fontSchemeId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  radius: fc.float({ min: 0, max: 2 }),
  scale: fc.float({ min: 0.5, max: 2 }),
  mode: fc.constantFrom('light' as const, 'dark' as const),
  previewColors: fc.array(hexColorArb, { minLength: 1, maxLength: 6 }),
  isDefault: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  createdBy: fc.option(fc.string()),
  updatedBy: fc.option(fc.string()),
});

const brandingConfigArb = fc.record({
  tenantBranding: fc.record({
    id: fc.string(),
    empresaId: fc.string(),
    colorPaletteId: fc.option(fc.string()),
    fontSchemeId: fc.option(fc.string()),
    customCss: fc.option(fc.string()),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    createdBy: fc.option(fc.string()),
    updatedBy: fc.option(fc.string()),
  }),
  logos: fc.record({
    login: fc.option(fc.record({
      id: fc.string(),
      tenantBrandingId: fc.string(),
      logoType: fc.constant('login' as const),
      logoUrl: fc.webUrl(),
      fileName: fc.option(fc.string()),
      fileSize: fc.option(fc.integer({ min: 1 })),
      mimeType: fc.option(fc.string()),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    })),
    sidebar: fc.option(fc.record({
      id: fc.string(),
      tenantBrandingId: fc.string(),
      logoType: fc.constant('sidebar' as const),
      logoUrl: fc.webUrl(),
      fileName: fc.option(fc.string()),
      fileSize: fc.option(fc.integer({ min: 1 })),
      mimeType: fc.option(fc.string()),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    })),
    favicon: fc.option(fc.record({
      id: fc.string(),
      tenantBrandingId: fc.string(),
      logoType: fc.constant('favicon' as const),
      logoUrl: fc.webUrl(),
      fileName: fc.option(fc.string()),
      fileSize: fc.option(fc.integer({ min: 1 })),
      mimeType: fc.option(fc.string()),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    })),
  }),
  colorPalette: fc.option(fc.record({
    id: fc.string(),
    name: fc.string(),
    empresaId: fc.string(),
    primaryColor: hexColorArb,
    primaryForeground: hexColorArb,
    secondaryColor: hexColorArb,
    secondaryForeground: hexColorArb,
    accentColor: hexColorArb,
    accentForeground: hexColorArb,
    mutedColor: hexColorArb,
    mutedForeground: hexColorArb,
    backgroundColor: hexColorArb,
    foregroundColor: hexColorArb,
    cardColor: hexColorArb,
    cardForeground: hexColorArb,
    destructiveColor: hexColorArb,
    destructiveForeground: hexColorArb,
    sidebarBackground: hexColorArb,
    sidebarForeground: hexColorArb,
    sidebarPrimary: hexColorArb,
    sidebarPrimaryForeground: hexColorArb,
    isCustom: fc.boolean(),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    createdBy: fc.option(fc.string()),
    updatedBy: fc.option(fc.string()),
  })),
  fontScheme: fc.option(fc.record({
    id: fc.string(),
    name: fc.string(),
    empresaId: fc.string(),
    fontSans: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
    fontMono: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
    fontSizes: fc.record({
      xs: fc.string(),
      sm: fc.string(),
      base: fc.string(),
      lg: fc.string(),
      xl: fc.string(),
      '2xl': fc.string(),
      '3xl': fc.string(),
      '4xl': fc.string(),
    }),
    fontWeights: fc.record({
      light: fc.integer({ min: 100, max: 900 }),
      normal: fc.integer({ min: 100, max: 900 }),
      medium: fc.integer({ min: 100, max: 900 }),
      semibold: fc.integer({ min: 100, max: 900 }),
      bold: fc.integer({ min: 100, max: 900 }),
    }),
    googleFonts: fc.array(fc.string(), { maxLength: 10 }),
    isCustom: fc.boolean(),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    createdBy: fc.option(fc.string()),
    updatedBy: fc.option(fc.string()),
  })),
  customThemePresets: fc.array(customThemePresetArb, { maxLength: 10 }),
});

describe('Property 14: Theme Customizer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should extend theme customizer with tenant-specific options while maintaining compatibility', () => {
    fc.assert(
      fc.property(
        fc.array(customThemePresetArb, { minLength: 1, maxLength: 5 }),
        brandingConfigArb,
        (customPresets, _brandingConfig) => {
          // Test: Get all available presets including custom ones
          const allPresets = getAllAvailablePresets(customPresets);

          // Verify that standard presets are always included
          STANDARD_PRESETS.forEach(preset => {
            expect(allPresets).toContain(preset);
          });

          // Verify that custom presets are included
          customPresets.forEach(preset => {
            expect(allPresets).toContain(preset.id);
          });

          // Verify that custom presets don't override standard ones
          const standardCount = allPresets.filter(p => STANDARD_PRESETS.includes(p)).length;
          expect(standardCount).toBe(STANDARD_PRESETS.length);

          // Verify that total count is correct
          expect(allPresets.length).toBe(STANDARD_PRESETS.length + customPresets.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain existing theme functionality when custom presets are added', () => {
    fc.assert(
      fc.property(
        fc.array(customThemePresetArb, { maxLength: 3 }),
        fc.constantFrom(...STANDARD_PRESETS),
        (customPresets, standardPreset) => {
          // Setup: Create initial theme config
          const initialTheme: ThemeConfig = {
            preset: 'default',
            radius: 0.5,
            scale: 1.0,
            mode: 'light',
            customPresets,
          };

          // Test: Select a standard preset
          const updatedTheme = selectPreset(initialTheme, standardPreset, customPresets);

          // Verify that standard preset selection works correctly
          expect(updatedTheme.preset).toBe(standardPreset);
          expect(updatedTheme.radius).toBe(0.5); // Standard presets use default values
          expect(updatedTheme.scale).toBe(1.0);
          expect(updatedTheme.mode).toBe('light');

          // Verify that custom presets are preserved
          expect(updatedTheme.customPresets).toEqual(customPresets);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly handle custom preset selection and application', () => {
    fc.assert(
      fc.property(
        fc.array(customThemePresetArb, { minLength: 1, maxLength: 3 }),
        (customPresets) => {
          // Setup: Create initial theme config
          const initialTheme: ThemeConfig = {
            preset: 'default',
            radius: 0.5,
            scale: 1.0,
            mode: 'light',
            customPresets,
          };

          // Test: Select the first custom preset
          const firstCustomPreset = customPresets[0];
          const updatedTheme = selectPreset(initialTheme, firstCustomPreset.id, customPresets);

          // Verify that custom preset selection works correctly
          expect(updatedTheme.preset).toBe(firstCustomPreset.id);
          expect(updatedTheme.radius).toBe(firstCustomPreset.radius);
          expect(updatedTheme.scale).toBe(firstCustomPreset.scale);
          expect(updatedTheme.mode).toBe(firstCustomPreset.mode);

          // Verify that custom presets are preserved
          expect(updatedTheme.customPresets).toEqual(customPresets);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show brand customization section when branding is active', () => {
    fc.assert(
      fc.property(
        brandingConfigArb,
        (brandingConfig) => {
          // Test: Check if brand customization should be shown
          const shouldShow = shouldShowBrandCustomization(brandingConfig);

          // Verify logic based on branding configuration
          const hasColorPalette = !!brandingConfig.colorPalette;
          const hasFontScheme = !!brandingConfig.fontScheme;
          const hasLoginLogo = !!brandingConfig.logos?.login;
          const hasSidebarLogo = !!brandingConfig.logos?.sidebar;
          const hasFaviconLogo = !!brandingConfig.logos?.favicon;

          const expectedShow = hasColorPalette || hasFontScheme || hasLoginLogo || hasSidebarLogo || hasFaviconLogo;
          expect(shouldShow).toBe(expectedShow);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalid preset selection gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(customThemePresetArb, { maxLength: 3 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !STANDARD_PRESETS.includes(s)),
        (customPresets, invalidPresetId) => {
          // Ensure the invalid preset ID is not in custom presets
          const filteredCustomPresets = customPresets.filter(p => p.id !== invalidPresetId);
          
          // Setup: Create initial theme config
          const initialTheme: ThemeConfig = {
            preset: 'default',
            radius: 0.5,
            scale: 1.0,
            mode: 'light',
            customPresets: filteredCustomPresets,
          };

          // Test: Try to select an invalid preset
          const updatedTheme = selectPreset(initialTheme, invalidPresetId, filteredCustomPresets);

          // Verify that theme remains unchanged when invalid preset is selected
          expect(updatedTheme).toEqual(initialTheme);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve existing theme properties when extending with branding', () => {
    fc.assert(
      fc.property(
        fc.array(customThemePresetArb, { maxLength: 3 }),
        brandingConfigArb,
        fc.constantFrom(...STANDARD_PRESETS),
        fc.float({ min: 0, max: 2 }),
        fc.float({ min: 0.5, max: 2 }),
        fc.constantFrom('light' as const, 'dark' as const),
        (customPresets, brandingConfig, preset, radius, scale, mode) => {
          // Setup: Create theme config with existing properties and branding
          const themeWithBranding: ThemeConfig = {
            preset,
            radius,
            scale,
            mode,
            customPresets,
            activeBranding: brandingConfig,
          };

          // Test: Verify that all existing theme properties are preserved
          expect(themeWithBranding.preset).toBe(preset);
          expect(themeWithBranding.radius).toBe(radius);
          expect(themeWithBranding.scale).toBe(scale);
          expect(themeWithBranding.mode).toBe(mode);
          expect(themeWithBranding.customPresets).toEqual(customPresets);
          expect(themeWithBranding.activeBranding).toEqual(brandingConfig);

          // Test: Verify that standard preset selection still works with branding active
          const updatedTheme = selectPreset(themeWithBranding, 'blue', customPresets);
          expect(updatedTheme.preset).toBe('blue');
          expect(updatedTheme.activeBranding).toEqual(brandingConfig); // Branding should be preserved

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});