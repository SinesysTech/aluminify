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
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fc from 'fast-check';
import React from 'react';
import { ThemeConfigProvider, ExtendedThemeConfig, DEFAULT_THEME } from '@/components/active-theme';
import { PresetSelector } from '@/components/ui/theme-customizer/preset-selector';
import { ThemeCustomizerPanel } from '@/components/ui/theme-customizer/panel';
import { CustomThemePreset, CompleteBrandingConfig } from '@/types/brand-customization';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for API calls
global.fetch = jest.fn();

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ThemeConfigProvider, {}, children);
}

// Generators for property-based testing
const customThemePresetArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  empresaId: fc.string({ minLength: 1, maxLength: 50 }),
  colorPaletteId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  fontSchemeId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  radius: fc.float({ min: 0, max: 2 }),
  scale: fc.float({ min: 0.5, max: 2 }),
  mode: fc.constantFrom('light' as const, 'dark' as const),
  previewColors: fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { minLength: 1, maxLength: 6 }),
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
    primaryColor: fc.hexaString().map(s => `#${s}`),
    primaryForeground: fc.hexaString().map(s => `#${s}`),
    secondaryColor: fc.hexaString().map(s => `#${s}`),
    secondaryForeground: fc.hexaString().map(s => `#${s}`),
    accentColor: fc.hexaString().map(s => `#${s}`),
    accentForeground: fc.hexaString().map(s => `#${s}`),
    mutedColor: fc.hexaString().map(s => `#${s}`),
    mutedForeground: fc.hexaString().map(s => `#${s}`),
    backgroundColor: fc.hexaString().map(s => `#${s}`),
    foregroundColor: fc.hexaString().map(s => `#${s}`),
    cardColor: fc.hexaString().map(s => `#${s}`),
    cardForeground: fc.hexaString().map(s => `#${s}`),
    destructiveColor: fc.hexaString().map(s => `#${s}`),
    destructiveForeground: fc.hexaString().map(s => `#${s}`),
    sidebarBackground: fc.hexaString().map(s => `#${s}`),
    sidebarForeground: fc.hexaString().map(s => `#${s}`),
    sidebarPrimary: fc.hexaString().map(s => `#${s}`),
    sidebarPrimaryForeground: fc.hexaString().map(s => `#${s}`),
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
        (customPresets, brandingConfig) => {
          // Setup: Create theme config with custom presets
          const themeWithCustomPresets = {
            ...DEFAULT_THEME,
            customPresets,
            activeBranding: brandingConfig,
          };

          // Mock localStorage to return our theme
          localStorageMock.getItem.mockReturnValue(JSON.stringify(themeWithCustomPresets));

          // Render PresetSelector component
          const { container } = render(
            React.createElement(TestWrapper, {}, 
              React.createElement(PresetSelector)
            )
          );

          // Verify that the component renders without errors
          expect(container).toBeTruthy();

          // Find the select trigger
          const selectTrigger = screen.getByRole('combobox');
          expect(selectTrigger).toBeInTheDocument();

          // Open the select dropdown
          act(() => {
            fireEvent.click(selectTrigger);
          });

          // Verify that both standard presets and custom presets are available
          // Standard presets should always be present
          expect(screen.getByText('Default')).toBeInTheDocument();
          expect(screen.getByText('Blue')).toBeInTheDocument();
          expect(screen.getByText('Green')).toBeInTheDocument();
          expect(screen.getByText('Purple')).toBeInTheDocument();

          // Custom presets should be present if they exist
          customPresets.forEach(preset => {
            expect(screen.getByText(preset.name)).toBeInTheDocument();
            
            // Default presets should be marked as such
            if (preset.isDefault) {
              expect(screen.getByText('(Default)')).toBeInTheDocument();
            }
          });

          // Verify that custom presets are visually distinguished (separated)
          if (customPresets.length > 0) {
            // There should be a separator between standard and custom presets
            const separators = container.querySelectorAll('[role="separator"]');
            expect(separators.length).toBeGreaterThan(0);
          }

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
        fc.constantFrom('default', 'blue', 'green', 'purple'),
        (customPresets, standardPreset) => {
          // Setup: Create theme config with custom presets
          const themeWithCustomPresets = {
            ...DEFAULT_THEME,
            customPresets,
            preset: standardPreset,
          };

          localStorageMock.getItem.mockReturnValue(JSON.stringify(themeWithCustomPresets));

          // Render PresetSelector component
          render(
            React.createElement(TestWrapper, {}, 
              React.createElement(PresetSelector)
            )
          );

          // Find the select trigger
          const selectTrigger = screen.getByRole('combobox');
          
          // Open the select dropdown
          act(() => {
            fireEvent.click(selectTrigger);
          });

          // Select a standard preset
          const standardPresetOption = screen.getByText('Default');
          act(() => {
            fireEvent.click(standardPresetOption);
          });

          // Verify that localStorage was called to save the theme
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'theme-config',
            expect.stringContaining('"preset":"default"')
          );

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
          // Setup: Create theme config with custom presets
          const themeWithCustomPresets = {
            ...DEFAULT_THEME,
            customPresets,
          };

          localStorageMock.getItem.mockReturnValue(JSON.stringify(themeWithCustomPresets));

          // Render PresetSelector component
          render(
            React.createElement(TestWrapper, {}, 
              React.createElement(PresetSelector)
            )
          );

          // Find the select trigger
          const selectTrigger = screen.getByRole('combobox');
          
          // Open the select dropdown
          act(() => {
            fireEvent.click(selectTrigger);
          });

          // Select the first custom preset
          const firstCustomPreset = customPresets[0];
          const customPresetOption = screen.getByText(firstCustomPreset.name);
          
          act(() => {
            fireEvent.click(customPresetOption);
          });

          // Verify that localStorage was called with the custom preset configuration
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'theme-config',
            expect.stringContaining(`"preset":"${firstCustomPreset.id}"`)
          );

          // Verify that the custom preset's properties are applied
          const savedThemeCall = localStorageMock.setItem.mock.calls.find(
            call => call[0] === 'theme-config'
          );
          
          if (savedThemeCall) {
            const savedTheme = JSON.parse(savedThemeCall[1]);
            expect(savedTheme.radius).toBe(firstCustomPreset.radius);
            expect(savedTheme.scale).toBe(firstCustomPreset.scale);
            expect(savedTheme.mode).toBe(firstCustomPreset.mode);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show brand customization section in theme customizer panel for authorized users', () => {
    fc.assert(
      fc.property(
        brandingConfigArb,
        (brandingConfig) => {
          // Setup: Create theme config with branding
          const themeWithBranding = {
            ...DEFAULT_THEME,
            activeBranding: brandingConfig,
          };

          localStorageMock.getItem.mockReturnValue(JSON.stringify(themeWithBranding));

          // Render ThemeCustomizerPanel component
          render(
            React.createElement(TestWrapper, {}, 
              React.createElement(ThemeCustomizerPanel)
            )
          );

          // Find and click the theme customizer trigger
          const trigger = screen.getByRole('button');
          act(() => {
            fireEvent.click(trigger);
          });

          // Verify that brand customization section is present
          expect(screen.getByText('Brand Customization')).toBeInTheDocument();
          expect(screen.getByText('Customize')).toBeInTheDocument();

          // If branding is active, verify status information is shown
          if (brandingConfig.colorPalette || brandingConfig.fontScheme || brandingConfig.logos.login) {
            expect(screen.getByText('Custom branding active')).toBeInTheDocument();
            
            if (brandingConfig.colorPalette) {
              expect(screen.getByText('• Custom colors applied')).toBeInTheDocument();
            }
            
            if (brandingConfig.fontScheme) {
              expect(screen.getByText('• Custom fonts applied')).toBeInTheDocument();
            }
            
            if (brandingConfig.logos.login) {
              expect(screen.getByText('• Custom logo applied')).toBeInTheDocument();
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});