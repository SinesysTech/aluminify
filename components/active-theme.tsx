"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomThemePreset, CompleteBrandingConfig } from '@/types/brand-customization';

// Extended theme configuration that includes brand customization
export interface ExtendedThemeConfig {
  preset: string;
  radius: number;
  scale: number;
  mode: 'light' | 'dark';
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
}

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ExtendedThemeConfig>(DEFAULT_THEME);

  const setTheme = (newTheme: ExtendedThemeConfig) => {
    setThemeState(newTheme);
    // Apply theme to CSS custom properties
    applyThemeToCSS(newTheme);
    // Save to localStorage
    localStorage.setItem('theme-config', JSON.stringify(newTheme));
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

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme-config');
    if (saved) {
      try {
        const parsedTheme = JSON.parse(saved);
        setThemeState(parsedTheme);
        applyThemeToCSS(parsedTheme);
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    }
  }, []);

  return (
    <ThemeConfigContext.Provider value={{ theme, setTheme, loadTenantBranding, applyBrandingToTheme }}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider');
  }
  return context;
}

// Apply theme configuration to CSS custom properties
function applyThemeToCSS(theme: ExtendedThemeConfig) {
  const root = document.documentElement;

  // Apply basic theme properties
  root.style.setProperty('--radius', `${theme.radius}rem`);
  root.style.setProperty('--scale', theme.scale.toString());

  // Apply dark/light mode
  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Apply brand customization if available
  if (theme.activeBranding?.colorPalette) {
    const palette = theme.activeBranding.colorPalette;
    
    // Apply color palette to CSS custom properties
    root.style.setProperty('--primary', palette.primaryColor);
    root.style.setProperty('--primary-foreground', palette.primaryForeground);
    root.style.setProperty('--secondary', palette.secondaryColor);
    root.style.setProperty('--secondary-foreground', palette.secondaryForeground);
    root.style.setProperty('--accent', palette.accentColor);
    root.style.setProperty('--accent-foreground', palette.accentForeground);
    root.style.setProperty('--muted', palette.mutedColor);
    root.style.setProperty('--muted-foreground', palette.mutedForeground);
    root.style.setProperty('--background', palette.backgroundColor);
    root.style.setProperty('--foreground', palette.foregroundColor);
    root.style.setProperty('--card', palette.cardColor);
    root.style.setProperty('--card-foreground', palette.cardForeground);
    root.style.setProperty('--destructive', palette.destructiveColor);
    root.style.setProperty('--destructive-foreground', palette.destructiveForeground);
    root.style.setProperty('--sidebar-background', palette.sidebarBackground);
    root.style.setProperty('--sidebar-foreground', palette.sidebarForeground);
    root.style.setProperty('--sidebar-primary', palette.sidebarPrimary);
    root.style.setProperty('--sidebar-primary-foreground', palette.sidebarPrimaryForeground);
  }

  // Apply font scheme if available
  if (theme.activeBranding?.fontScheme) {
    const fontScheme = theme.activeBranding.fontScheme;
    
    root.style.setProperty('--font-sans', fontScheme.fontSans.join(', '));
    root.style.setProperty('--font-mono', fontScheme.fontMono.join(', '));
    
    // Load Google Fonts if needed
    if (fontScheme.googleFonts.length > 0) {
      loadGoogleFonts(fontScheme.googleFonts);
    }
  }
}

// Load Google Fonts dynamically
function loadGoogleFonts(fonts: string[]) {
  const existingLink = document.querySelector('link[data-google-fonts]');
  if (existingLink) {
    existingLink.remove();
  }

  const fontFamilies = fonts.map(font => font.replace(' ', '+')).join('|');
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  link.setAttribute('data-google-fonts', 'true');
  document.head.appendChild(link);
}