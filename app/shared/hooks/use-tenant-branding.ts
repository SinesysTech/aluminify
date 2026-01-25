/**
 * Tenant Branding Hook
 * 
 * Custom hook for managing tenant branding state and real-time updates.
 * Provides utilities for components that need to react to branding changes.
 */

import { useCallback, useEffect, useState, useContext } from 'react';
import { useTenantBranding, TenantBrandingContext, type TenantBrandingContextType } from '@/components/providers/tenant-branding-provider';
import { getCSSPropertiesManager } from '@/app/shared/core/services/css-properties-manager';
import type { CompleteBrandingConfig, ColorPalette, FontScheme, LogoType } from '@/types/brand-customization';

export interface TenantBrandingHookReturn {
  // State
  branding: CompleteBrandingConfig | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  hasCustomBranding: boolean;
  hasCustomColors: boolean;
  hasCustomFonts: boolean;
  hasCustomLogos: boolean;
  
  // CSS Properties
  appliedProperties: string[];
  isPropertyApplied: (property: string) => boolean;
  getPropertyValue: (property: string) => string;
  
  // Real-time updates
  triggerUpdate: () => void;
}

/**
 * Hook for managing tenant branding with real-time updates
 */
export function useTenantBrandingState(): TenantBrandingHookReturn {
  const {
    currentBranding,
    loadingBranding,
    error,
    refreshBranding,
    clearError,
    triggerCrossTabUpdate,
  } = useTenantBranding();

  const [appliedProperties, setAppliedProperties] = useState<string[]>([]);

  // Update applied properties when branding changes
  useEffect(() => {
    const cssManager = getCSSPropertiesManager();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppliedProperties(cssManager.getAppliedProperties());
  }, [currentBranding]);

  // Utility functions
  const hasCustomBranding = Boolean(currentBranding);
  const hasCustomColors = Boolean(currentBranding?.colorPalette);
  const hasCustomFonts = Boolean(currentBranding?.fontScheme);
  const hasCustomLogos = Boolean(
    currentBranding?.logos.login || 
    currentBranding?.logos.sidebar || 
    currentBranding?.logos.favicon
  );

  const isPropertyApplied = useCallback((property: string): boolean => {
    const cssManager = getCSSPropertiesManager();
    return cssManager.isPropertyApplied(property);
  }, []);

  const getPropertyValue = useCallback((property: string): string => {
    const cssManager = getCSSPropertiesManager();
    return cssManager.getProperty(property);
  }, []);

  const triggerUpdate = useCallback(() => {
    triggerCrossTabUpdate();
  }, [triggerCrossTabUpdate]);

  return {
    // State
    branding: currentBranding,
    loading: loadingBranding,
    error,
    
    // Actions
    refresh: refreshBranding,
    clearError,
    
    // Utilities
    hasCustomBranding,
    hasCustomColors,
    hasCustomFonts,
    hasCustomLogos,
    
    // CSS Properties
    appliedProperties,
    isPropertyApplied,
    getPropertyValue,
    
    // Real-time updates
    triggerUpdate,
  };
}

/**
 * Hook for listening to specific branding property changes
 */
export function useBrandingProperty(property: string) {
  const [value, setValue] = useState<string>('');
  const { branding } = useTenantBrandingState();

  useEffect(() => {
    const cssManager = getCSSPropertiesManager();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(cssManager.getProperty(property));
  }, [property, branding]);

  return value;
}

/**
 * Hook for color palette changes
 */
export function useColorPalette(): {
  palette: ColorPalette | null;
  isCustom: boolean;
  primaryColor: string;
  backgroundColor: string;
  foregroundColor: string;
} {
  const { branding } = useTenantBrandingState();
  const primaryColor = useBrandingProperty('--primary');
  const backgroundColor = useBrandingProperty('--background');
  const foregroundColor = useBrandingProperty('--foreground');

  return {
    palette: branding?.colorPalette || null,
    isCustom: Boolean(branding?.colorPalette),
    primaryColor,
    backgroundColor,
    foregroundColor,
  };
}

/**
 * Hook for font scheme changes
 */
export function useFontScheme(): {
  scheme: FontScheme | null;
  isCustom: boolean;
  fontSans: string;
  fontMono: string;
} {
  const { branding } = useTenantBrandingState();
  const fontSans = useBrandingProperty('--font-sans');
  const fontMono = useBrandingProperty('--font-mono');

  return {
    scheme: branding?.fontScheme || null,
    isCustom: Boolean(branding?.fontScheme),
    fontSans,
    fontMono,
  };
}

/**
 * Hook for logo URLs
 */
export function useLogos(): {
  loginLogo: string | null;
  sidebarLogo: string | null;
  faviconLogo: string | null;
  hasAnyLogo: boolean;
} {
  const { branding } = useTenantBrandingState();

  const loginLogo = branding?.logos.login?.logoUrl || null;
  const sidebarLogo = branding?.logos.sidebar?.logoUrl || null;
  const faviconLogo = branding?.logos.favicon?.logoUrl || null;
  const hasAnyLogo = Boolean(loginLogo || sidebarLogo || faviconLogo);

  return {
    loginLogo,
    sidebarLogo,
    faviconLogo,
    hasAnyLogo,
  };
}

/**
 * Hook for branding loading state with timeout
 */
export function useBrandingLoadingState(timeoutMs: number = 5000): {
  loading: boolean;
  timedOut: boolean;
  error: string | null;
} {
  const { loading, error } = useTenantBrandingState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimedOut(false);
      const timeout = setTimeout(() => {
        setTimedOut(true);
      }, timeoutMs);

      return () => clearTimeout(timeout);
    } else {
      setTimedOut(false);
    }
  }, [loading, timeoutMs]);

  return {
    loading,
    timedOut,
    error,
  };
}

/**
 * Hook for detecting branding changes
 */
export function useBrandingChangeDetection(): {
  hasChanged: boolean;
  lastChangeTime: Date | null;
  resetChangeFlag: () => void;
} {
  const { branding } = useTenantBrandingState();
  const [hasChanged, setHasChanged] = useState(false);
  const [lastChangeTime, setLastChangeTime] = useState<Date | null>(null);
  const [previousBranding, setPreviousBranding] = useState<CompleteBrandingConfig | null>(null);

  useEffect(() => {
    if (JSON.stringify(branding) !== JSON.stringify(previousBranding)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasChanged(true);
      setLastChangeTime(new Date());
      setPreviousBranding(branding);
    }
  }, [branding, previousBranding]);

  const resetChangeFlag = useCallback(() => {
    setHasChanged(false);
  }, []);

  return {
    hasChanged,
    lastChangeTime,
    resetChangeFlag,
  };
}

/**
 * Optional hook that returns null when used outside of TenantBrandingProvider
 * Useful for components that need to work in both authenticated and unauthenticated contexts
 */
export function useTenantBrandingOptional(): TenantBrandingContextType | null {
  const context = useContext(TenantBrandingContext);

  // Check if we have a valid context with actual data
  // The default context has empty functions, so we check if refreshBranding is the default no-op
  if (!context || context.refreshBranding.toString() === 'async () => {}') {
    return null;
  }

  return context;
}

/**
 * Hook for getting a specific logo URL with cache-busting
 * Works in both connected (via provider) and standalone modes
 */
export function useLogoUrl(logoType: LogoType, empresaId?: string): {
  url: string | null;
  loading: boolean;
  error: boolean;
  mode: 'connected' | 'standalone';
} {
  const context = useTenantBrandingOptional();
  const [standaloneUrl, setStandaloneUrl] = useState<string | null>(null);
  const [standaloneLoading, setStandaloneLoading] = useState(false);
  const [standaloneError, setStandaloneError] = useState(false);

  // Determine if we're in connected mode
  const isConnected = !!(context && context.currentBranding);

  // Standalone mode: fetch from API (hook must be called unconditionally)
  useEffect(() => {
    // Skip if in connected mode or no empresaId
    if (isConnected || !empresaId) return;

    const fetchLogo = async () => {
      setStandaloneLoading(true);
      setStandaloneError(false);

      try {
        const response = await fetch(`/api/tenant-branding/${empresaId}/logos/${logoType}/public`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.logoUrl) {
            setStandaloneUrl(result.data.logoUrl);
          } else {
            setStandaloneUrl(null);
          }
        } else {
          setStandaloneUrl(null);
        }
      } catch {
        setStandaloneError(true);
        setStandaloneUrl(null);
      } finally {
        setStandaloneLoading(false);
      }
    };

    fetchLogo();
  }, [empresaId, logoType, isConnected]);

  // Connected mode: use context
  if (isConnected && context) {
    const logo = context.currentBranding!.logos[logoType];
    const url = logo?.logoUrl || null;
    const versionedUrl = url && context.logoVersion
      ? `${url}${url.includes('?') ? '&' : '?'}v=${context.logoVersion}`
      : url;

    return {
      url: versionedUrl,
      loading: context.loadingBranding,
      error: !!context.error,
      mode: 'connected',
    };
  }

  return {
    url: standaloneUrl,
    loading: standaloneLoading,
    error: standaloneError,
    mode: 'standalone',
  };
}