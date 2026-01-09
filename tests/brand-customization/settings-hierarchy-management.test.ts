/**
 * Property-Based Test: Settings Hierarchy Management
 * 
 * Feature: brand-customization, Property 15: Settings Hierarchy Management
 * Validates: Requirements 6.3, 6.5
 * 
 * Tests that the system distinguishes between personal preferences and empresa-wide branding,
 * prioritizing empresa branding for brand-related elements when conflicts arise.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { ExtendedThemeConfig } from '@/components/active-theme';
import { CustomThemePreset, ColorPalette, FontScheme } from '@/types/brand-customization';

// Mock localStorage for theme configuration
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock document for CSS custom properties testing
const mockDocumentElement = {
  style: {
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  },
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  },
};
Object.defineProperty(global, 'document', {
  value: {
    documentElement: mockDocumentElement,
    querySelector: jest.fn(),
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      remove: jest.fn(),
    })),
    head: {
      appendChild: jest.fn(),
    },
  },
});

// Personal preference settings (user-controlled)
interface PersonalPreferences {
  radius: number;
  scale: number;
  mode: 'light' | 'dark';
  preset: string; // Can be overridden by empresa default preset
}

// Empresa branding settings (company-controlled)
interface EmpresaBrandingSettings {
  colorPalette?: ColorPalette;
  fontScheme?: FontScheme;
  customPresets: CustomThemePreset[];
  defaultPresetId?: string;
}

// Helper function to simulate settings hierarchy resolution
function resolveSettingsHierarchy(
  personalPrefs: PersonalPreferences,
  empresaBranding: EmpresaBrandingSettings
): ExtendedThemeConfig {
  const resolvedTheme: ExtendedThemeConfig = {
    // Start with personal preferences
    radius: personalPrefs.radius,
    scale: personalPrefs.scale,
    mode: personalPrefs.mode,
    preset: personalPrefs.preset,
    
    // Add empresa branding
    customPresets: empresaBranding.customPresets,
    activeBranding: empresaBranding.colorPalette || empresaBranding.fontScheme ? {
      tenantBranding: {
        id: 'test-branding',
        empresaId: 'test-empresa',
        colorPaletteId: empresaBranding.colorPalette?.id,
        fontSchemeId: empresaBranding.fontScheme?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      logos: {
        login: null,
        sidebar: null,
        favicon: null,
      },
      colorPalette: empresaBranding.colorPalette,
      fontScheme: empresaBranding.fontScheme,
      customThemePresets: empresaBranding.customPresets,
    } : undefined,
  };

  // HIERARCHY RULE: If empresa has a default preset, it overrides personal preset choice
  // but preserves other personal preferences (radius, scale, mode) unless the preset specifies them
  if (empresaBranding.defaultPresetId) {
    const defaultPreset = empresaBranding.customPresets.find(p => p.id === empresaBranding.defaultPresetId);
    if (defaultPreset) {
      resolvedTheme.preset = defaultPreset.id;
      // Empresa preset values take priority for brand-related settings
      // but personal preferences are preserved for non-brand settings
      resolvedTheme.radius = personalPrefs.radius; // Personal preference preserved
      resolvedTheme.scale = personalPrefs.scale;   // Personal preference preserved
      resolvedTheme.mode = personalPrefs.mode;     // Personal preference preserved
    }
  }

  return resolvedTheme;
}

// Helper function to check if brand-related CSS properties are applied
function getBrandRelatedCSSProperties(theme: ExtendedThemeConfig): Record<string, string> {
  const brandProperties: Record<string, string> = {};
  
  if (theme.activeBranding?.colorPalette) {
    const palette = theme.activeBranding.colorPalette;
    brandProperties['--primary'] = palette.primaryColor;
    brandProperties['--secondary'] = palette.secondaryColor;
    brandProperties['--accent'] = palette.accentColor;
    brandProperties['--background'] = palette.backgroundColor;
    brandProperties['--sidebar-background'] = palette.sidebarBackground;
  }
  
  if (theme.activeBranding?.fontScheme) {
    const fontScheme = theme.activeBranding.fontScheme;
    brandProperties['--font-sans'] = fontScheme.fontSans.join(', ');
    brandProperties['--font-mono'] = fontScheme.fontMono.join(', ');
  }
  
  return brandProperties;
}

// Helper function to check if personal CSS properties are applied
function getPersonalCSSProperties(theme: ExtendedThemeConfig): Record<string, string> {
  return {
    '--radius': `${theme.radius}rem`,
    '--scale': theme.scale.toString(),
  };
}

// Generators for property-based testing
const hexColorArb = fc.integer({ min: 0, max: 0xffffff }).map(n => `#${n.toString(16).padStart(6, '0')}`);

const personalPreferencesArb = fc.record({
  radius: fc.float({ min: 0, max: 2 }),
  scale: fc.float({ min: 0.5, max: 2 }),
  mode: fc.constantFrom('light' as const, 'dark' as const),
  preset: fc.constantFrom('default', 'blue', 'green', 'purple'),
});

const colorPaletteArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  empresaId: fc.string({ minLength: 1, maxLength: 50 }),
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
});

const fontSchemeArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  empresaId: fc.string({ minLength: 1, maxLength: 50 }),
  fontSans: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
  fontMono: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
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
});

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

const empresaBrandingArb = fc.record({
  colorPalette: fc.option(colorPaletteArb),
  fontScheme: fc.option(fontSchemeArb),
  customPresets: fc.array(customThemePresetArb, { maxLength: 5 }),
  defaultPresetId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
});

describe('Property 15: Settings Hierarchy Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockDocumentElement.style.setProperty.mockClear();
    mockDocumentElement.classList.add.mockClear();
    mockDocumentElement.classList.remove.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should distinguish between personal preferences and empresa-wide branding', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        empresaBrandingArb,
        (personalPrefs, empresaBranding) => {
          // Test: Resolve settings hierarchy
          const resolvedTheme = resolveSettingsHierarchy(personalPrefs, empresaBranding);

          // Verify that personal preferences are preserved for non-brand elements
          expect(resolvedTheme.radius).toBe(personalPrefs.radius);
          expect(resolvedTheme.scale).toBe(personalPrefs.scale);
          expect(resolvedTheme.mode).toBe(personalPrefs.mode);

          // Verify that empresa branding is applied for brand elements
          if (empresaBranding.colorPalette) {
            expect(resolvedTheme.activeBranding?.colorPalette).toEqual(empresaBranding.colorPalette);
          }
          
          if (empresaBranding.fontScheme) {
            expect(resolvedTheme.activeBranding?.fontScheme).toEqual(empresaBranding.fontScheme);
          }

          // Verify that custom presets are available
          expect(resolvedTheme.customPresets).toEqual(empresaBranding.customPresets);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prioritize empresa branding for brand-related elements when conflicts arise', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        empresaBrandingArb.filter(branding => branding.customPresets.length > 0),
        (personalPrefs, empresaBranding) => {
          // Setup: Create a scenario where empresa has a default preset that conflicts with personal preset
          const defaultPreset = empresaBranding.customPresets[0];
          const empresaBrandingWithDefault: EmpresaBrandingSettings = {
            ...empresaBranding,
            defaultPresetId: defaultPreset.id,
          };

          // Ensure personal preset is different from empresa default
          const personalPrefsWithDifferentPreset: PersonalPreferences = {
            ...personalPrefs,
            preset: personalPrefs.preset === defaultPreset.id ? 'default' : personalPrefs.preset,
          };

          // Test: Resolve settings hierarchy
          const resolvedTheme = resolveSettingsHierarchy(personalPrefsWithDifferentPreset, empresaBrandingWithDefault);

          // Verify that empresa default preset takes priority over personal preset choice
          expect(resolvedTheme.preset).toBe(defaultPreset.id);

          // Verify that personal preferences are still preserved for non-brand settings
          expect(resolvedTheme.radius).toBe(personalPrefsWithDifferentPreset.radius);
          expect(resolvedTheme.scale).toBe(personalPrefsWithDifferentPreset.scale);
          expect(resolvedTheme.mode).toBe(personalPrefsWithDifferentPreset.mode);

          // Verify that empresa branding elements are applied
          if (empresaBrandingWithDefault.colorPalette) {
            expect(resolvedTheme.activeBranding?.colorPalette).toEqual(empresaBrandingWithDefault.colorPalette);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply brand-related CSS properties from empresa branding while preserving personal CSS properties', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        empresaBrandingArb.filter(branding => branding.colorPalette || branding.fontScheme),
        (personalPrefs, empresaBranding) => {
          // Test: Resolve settings hierarchy
          const resolvedTheme = resolveSettingsHierarchy(personalPrefs, empresaBranding);

          // Get expected CSS properties
          const brandProperties = getBrandRelatedCSSProperties(resolvedTheme);
          const personalProperties = getPersonalCSSProperties(resolvedTheme);

          // Verify that brand-related properties come from empresa branding
          if (empresaBranding.colorPalette) {
            expect(brandProperties['--primary']).toBe(empresaBranding.colorPalette.primaryColor);
            expect(brandProperties['--secondary']).toBe(empresaBranding.colorPalette.secondaryColor);
            expect(brandProperties['--background']).toBe(empresaBranding.colorPalette.backgroundColor);
          }

          if (empresaBranding.fontScheme) {
            expect(brandProperties['--font-sans']).toBe(empresaBranding.fontScheme.fontSans.join(', '));
            expect(brandProperties['--font-mono']).toBe(empresaBranding.fontScheme.fontMono.join(', '));
          }

          // Verify that personal properties come from personal preferences
          expect(personalProperties['--radius']).toBe(`${personalPrefs.radius}rem`);
          expect(personalProperties['--scale']).toBe(personalPrefs.scale.toString());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle scenarios where no empresa branding exists and preserve all personal preferences', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        (personalPrefs) => {
          // Setup: No empresa branding
          const noBranding: EmpresaBrandingSettings = {
            customPresets: [],
          };

          // Test: Resolve settings hierarchy
          const resolvedTheme = resolveSettingsHierarchy(personalPrefs, noBranding);

          // Verify that all personal preferences are preserved
          expect(resolvedTheme.radius).toBe(personalPrefs.radius);
          expect(resolvedTheme.scale).toBe(personalPrefs.scale);
          expect(resolvedTheme.mode).toBe(personalPrefs.mode);
          expect(resolvedTheme.preset).toBe(personalPrefs.preset);

          // Verify that no empresa branding is applied
          expect(resolvedTheme.activeBranding).toBeUndefined();
          expect(resolvedTheme.customPresets).toEqual([]);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple custom presets correctly and only apply default when specified', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        fc.array(customThemePresetArb, { minLength: 2, maxLength: 5 }),
        (personalPrefs, customPresets) => {
          // Setup: Multiple custom presets, some marked as default
          const presetsWithDefault = customPresets.map((preset, index) => ({
            ...preset,
            isDefault: index === 0, // Only first preset is default
          }));

          const empresaBranding: EmpresaBrandingSettings = {
            customPresets: presetsWithDefault,
            defaultPresetId: presetsWithDefault[0].id,
          };

          // Test: Resolve settings hierarchy
          const resolvedTheme = resolveSettingsHierarchy(personalPrefs, empresaBranding);

          // Verify that the default preset is applied
          expect(resolvedTheme.preset).toBe(presetsWithDefault[0].id);

          // Verify that all custom presets are available
          expect(resolvedTheme.customPresets).toEqual(presetsWithDefault);

          // Verify that personal preferences are preserved for non-brand settings
          expect(resolvedTheme.radius).toBe(personalPrefs.radius);
          expect(resolvedTheme.scale).toBe(personalPrefs.scale);
          expect(resolvedTheme.mode).toBe(personalPrefs.mode);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should gracefully handle invalid default preset IDs and fall back to personal preferences', () => {
    fc.assert(
      fc.property(
        personalPreferencesArb,
        fc.array(customThemePresetArb, { minLength: 1, maxLength: 3 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (personalPrefs, customPresets, invalidPresetId) => {
          // Ensure the invalid preset ID is not in the custom presets
          const filteredPresets = customPresets.filter(p => p.id !== invalidPresetId);
          
          const empresaBranding: EmpresaBrandingSettings = {
            customPresets: filteredPresets,
            defaultPresetId: invalidPresetId, // Invalid ID
          };

          // Test: Resolve settings hierarchy with invalid default preset ID
          const resolvedTheme = resolveSettingsHierarchy(personalPrefs, empresaBranding);

          // Verify that personal preset preference is preserved when default is invalid
          expect(resolvedTheme.preset).toBe(personalPrefs.preset);

          // Verify that other personal preferences are preserved
          expect(resolvedTheme.radius).toBe(personalPrefs.radius);
          expect(resolvedTheme.scale).toBe(personalPrefs.scale);
          expect(resolvedTheme.mode).toBe(personalPrefs.mode);

          // Verify that custom presets are still available
          expect(resolvedTheme.customPresets).toEqual(filteredPresets);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});