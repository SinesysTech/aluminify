'use client';

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import type { CompleteBrandingConfig } from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/brand-customization.types';
import { getCSSPropertiesManager } from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/css-properties-manager';
import type { ExtendedThemeConfig, ThemePreset } from './types';

export const DEFAULT_THEME: ExtendedThemeConfig = {
  preset: 'default',
  radius: 'md',
  scale: 'md',
  contentLayout: 'full',
  mode: 'system',
};

export const THEMES: ThemePreset[] = [
  { name: 'Default', value: 'default', colors: ['#1f1f1f', '#525252', '#e5e5e5'] },
  { name: 'Underground', value: 'underground', colors: ['#10B981', '#EC4899', '#374151'] },
  { name: 'Rose Garden', value: 'rose-garden', colors: ['#F43F5E', '#FB7185', '#FDF2F8'] },
  { name: 'Lake View', value: 'lake-view', colors: ['#06B6D4', '#22D3EE', '#ECFEFF'] },
  { name: 'Sunset Glow', value: 'sunset-glow', colors: ['#F97316', '#FB923C', '#FFF7ED'] },
  { name: 'Forest Whisper', value: 'forest-whisper', colors: ['#22C55E', '#4ADE80', '#F0FDF4'] },
  { name: 'Ocean Breeze', value: 'ocean-breeze', colors: ['#3B82F6', '#60A5FA', '#EFF6FF'] },
  { name: 'Lavender Dream', value: 'lavender-dream', colors: ['#A855F7', '#C084FC', '#FAF5FF'] },
];

interface ThemeConfigContextType {
  theme: ExtendedThemeConfig;
  setTheme: (theme: Partial<ExtendedThemeConfig>) => void;
  applyBrandingToTheme: (branding: CompleteBrandingConfig) => void;
  resetBrandingToDefaults: () => void;
}

const ThemeConfigContext = createContext<ThemeConfigContextType | null>(null);

function getInitialTheme(): ExtendedThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  // Read from cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    preset: cookies['theme_preset'] || DEFAULT_THEME.preset,
    radius: cookies['theme_radius'] || DEFAULT_THEME.radius,
    scale: cookies['theme_scale'] || DEFAULT_THEME.scale,
    contentLayout: (cookies['theme_content_layout'] as 'full' | 'centered') || DEFAULT_THEME.contentLayout,
    mode: (cookies['theme_mode'] as 'light' | 'dark' | 'system') || DEFAULT_THEME.mode,
  };
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ExtendedThemeConfig>(getInitialTheme);
  const cssManager = typeof window !== 'undefined' ? getCSSPropertiesManager() : null;

  // Apply theme to DOM
  const applyThemeToDOM = useCallback((newTheme: ExtendedThemeConfig) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Set data attributes
    root.setAttribute('data-theme-preset', newTheme.preset);
    root.setAttribute('data-theme-radius', newTheme.radius);
    root.setAttribute('data-theme-scale', newTheme.scale);
    root.setAttribute('data-theme-content-layout', newTheme.contentLayout);
  }, []);

  // Apply initial theme on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [applyThemeToDOM, theme]);

  const setTheme = useCallback((updates: Partial<ExtendedThemeConfig>) => {
    setThemeState(prev => {
      const newTheme = { ...prev, ...updates };

      // Persist to cookies
      if (updates.preset !== undefined) setCookie('theme_preset', updates.preset);
      if (updates.radius !== undefined) setCookie('theme_radius', updates.radius);
      if (updates.scale !== undefined) setCookie('theme_scale', updates.scale);
      if (updates.contentLayout !== undefined) setCookie('theme_content_layout', updates.contentLayout);
      if (updates.mode !== undefined) setCookie('theme_mode', updates.mode);

      // Apply to DOM
      applyThemeToDOM(newTheme);

      return newTheme;
    });
  }, [applyThemeToDOM]);

  const applyBrandingToTheme = useCallback((branding: CompleteBrandingConfig) => {
    if (!cssManager) return;
    cssManager.applyBrandingConfiguration(branding);

    // Update theme with custom presets if available
    if (branding.customThemePresets && branding.customThemePresets.length > 0) {
      setThemeState(prev => ({
        ...prev,
        customPresets: branding.customThemePresets,
      }));
    }
  }, [cssManager]);

  const resetBrandingToDefaults = useCallback(() => {
    if (!cssManager) return;
    cssManager.resetToDefaults();

    // Clear custom presets
    setThemeState(prev => ({
      ...prev,
      customPresets: undefined,
    }));
  }, [cssManager]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    applyBrandingToTheme,
    resetBrandingToDefaults,
  }), [theme, setTheme, applyBrandingToTheme, resetBrandingToDefaults]);

  return (
    <ThemeConfigContext.Provider value={value}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export function useThemeConfig(): ThemeConfigContextType {
  const context = useContext(ThemeConfigContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within ThemeConfigProvider');
  }
  return context;
}
