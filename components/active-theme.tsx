"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomThemePreset, CompleteBrandingConfig } from '@/types/brand-customization';
import { getCSSPropertiesManager } from '@/lib/services/css-properties-manager';

export type ThemeType = 'light' | 'dark';

// Extended theme configuration that includes brand customization
export interface ExtendedThemeConfig {
  preset: string;
  radius: number;
  scale: number;
  mode: 'light' | 'dark';
  contentLayout: 'full' | 'centered';
  // Brand customization properties
  customPresets?: CustomThemePreset[];
  activeBranding?: CompleteBrandingConfig;
}

// Default theme configuration
export const DEFAULT_THEME: ExtendedThemeConfig = {
  preset: 'default',
  radius: 0.5,
  scale: 1,
  mode: 'light',
  contentLayout: 'full',
};

// Basic theme presets (will be extended with custom tenant presets)
export const THEMES = [
  {
    name: 'Default',
    value: 'default',
    colors: ['#0f172a', '#1e293b', '#334155', '#64748b'],
  },
  {
    name: 'Blue',
    value: 'blue',
    colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
  },
  {
    name: 'Green',
    value: 'green',
    colors: ['#166534', '#16a34a', '#4ade80', '#86efac'],
  },
  {
    name: 'Purple',
    value: 'purple',
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
  },
];

interface ThemeConfigContextType {
  theme: ExtendedThemeConfig;
  setTheme: (theme: ExtendedThemeConfig) => void;
  loadTenantBranding: (empresaId: string) => Promise<void>;
  applyBrandingToTheme: (branding: CompleteBrandingConfig) => void;
  resetBrandingToDefaults: () => void;
}

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

// ... imports

interface ActiveThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Partial<ExtendedThemeConfig>;
}

export function ThemeConfigProvider({ children, initialTheme }: ActiveThemeProviderProps) {
  const [theme, setThemeState] = useState<ExtendedThemeConfig>(() => {
    // If we have an initial theme (e.g. from cookies), start with it
    const base = {
      ...DEFAULT_THEME,
      ...(initialTheme || {}),
    } as ExtendedThemeConfig;

    if (typeof window === 'undefined') return base;

    const saved = localStorage.getItem('theme-config');
    if (!saved) return base;

    try {
      const parsed = JSON.parse(saved);
      return {
        ...base,
        ...parsed,
      } as ExtendedThemeConfig;
    } catch (error) {
      console.error('Failed to parse saved theme:', error);
      return base;
    }
  });

  const setTheme = (newTheme: ExtendedThemeConfig) => {
    setThemeState(newTheme);
  };

  const loadTenantBranding = async (empresaId: string) => {
    try {
      // Load tenant branding from API
      const response = await fetch(`/api/tenant-branding/${empresaId}`);
      if (response.ok) {
        const branding: CompleteBrandingConfig = await response.json();
        applyBrandingToTheme(branding);
      }
    } catch (error) {
      console.error('Failed to load tenant branding:', error);
    }
  };

  const applyBrandingToTheme = (branding: CompleteBrandingConfig) => {
    const updatedTheme: ExtendedThemeConfig = {
      ...theme,
      activeBranding: branding,
      customPresets: branding.customThemePresets,
    };

    // If there's a default custom preset, apply it
    const defaultPreset = branding.customThemePresets.find(p => p.isDefault);
    if (defaultPreset) {
      updatedTheme.preset = defaultPreset.id;
      updatedTheme.radius = defaultPreset.radius;
      updatedTheme.scale = defaultPreset.scale;
      updatedTheme.mode = defaultPreset.mode;
    }

    setTheme(updatedTheme);
  };

  const resetBrandingToDefaults = () => {
    const cssManager = getCSSPropertiesManager();
    cssManager.resetToDefaults();

    const resetTheme: ExtendedThemeConfig = {
      ...DEFAULT_THEME,
      activeBranding: undefined,
      customPresets: undefined,
    };

    setTheme(resetTheme);
  };

  useEffect(() => {
    applyThemeToCSS(theme);
    localStorage.setItem('theme-config', JSON.stringify(theme));
  }, [theme]);

  // Initial application on mount to ensure CSS matches state
  useEffect(() => {
    applyThemeToCSS(theme);
  }, []);

  return (
    <ThemeConfigContext.Provider value={{ theme, setTheme, loadTenantBranding, applyBrandingToTheme, resetBrandingToDefaults }}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export const ActiveThemeProvider = ThemeConfigProvider;

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider');
  }
  return context;
}

// Apply theme configuration to CSS custom properties
function applyThemeToCSS(theme: ExtendedThemeConfig) {
  const cssManager = getCSSPropertiesManager();

  // Apply basic theme properties (radius, scale)
  cssManager.applyThemeCustomizerProperties(theme.radius, theme.scale);

  // Apply dark/light mode
  cssManager.applyThemeMode(theme.mode);

  // Apply brand customization if available
  if (theme.activeBranding) {
    cssManager.applyBrandingConfiguration(theme.activeBranding);
  }
}

