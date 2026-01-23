"use client";

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useThemeConfig } from '@/components/active-theme';
import { getBrandingSyncManager } from '@/lib/services/branding-sync-manager';
import type { CompleteBrandingConfig, LogoType } from '@/types/brand-customization';
import { createClient } from '@/lib/client';

interface User {
  empresaId?: string;
  id?: string;
  // Add other user properties as needed
}

export interface TenantBrandingContextType {
  loadingBranding: boolean;
  error: string | null;
  currentBranding: CompleteBrandingConfig | null;
  refreshBranding: () => Promise<void>;
  clearError: () => void;
  triggerCrossTabUpdate: () => void;
  // New: Logo utilities with cache-busting
  logoVersion: number;
  getLogoUrl: (type: LogoType) => string | null;
  // Dynamic branding for multi-org students
  loadBrandingForEmpresa: (empresaId: string | null) => Promise<void>;
  /** The currently active empresa ID (may be overridden for multi-org students) */
  activeEmpresaId: string | null;
}

export const TenantBrandingContext = createContext<TenantBrandingContextType>({
  loadingBranding: false,
  error: null,
  currentBranding: null,
  refreshBranding: async () => { },
  clearError: () => { },
  triggerCrossTabUpdate: () => { },
  logoVersion: 0,
  getLogoUrl: () => null,
  loadBrandingForEmpresa: async () => { },
  activeEmpresaId: null,
});

interface TenantBrandingProviderProps {
  children: React.ReactNode;
  user?: User | null;
  /**
   * Override empresa ID for dynamic branding (used by multi-org students).
   * When set, loads branding for this empresa instead of user.empresaId.
   * When null, resets to default theme (for "All Organizations" view).
   * When undefined, uses user.empresaId as normal.
   */
  overrideEmpresaId?: string | null;
}

export function TenantBrandingProvider({ children, user, overrideEmpresaId }: TenantBrandingProviderProps) {
  const { applyBrandingToTheme, resetBrandingToDefaults } = useThemeConfig();
  const [loadingBranding, setLoadingBranding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentBranding, setCurrentBranding] = React.useState<CompleteBrandingConfig | null>(null);
  const [logoVersion, setLogoVersion] = React.useState(Date.now());
  // Track the dynamically selected empresa ID (for multi-org students)
  const [dynamicEmpresaId, setDynamicEmpresaId] = React.useState<string | null | undefined>(undefined);

  // Determine the effective empresa ID to use for branding
  // Priority: overrideEmpresaId prop > dynamicEmpresaId state > user.empresaId
  const effectiveEmpresaId = React.useMemo(() => {
    if (overrideEmpresaId !== undefined) {
      return overrideEmpresaId;
    }
    if (dynamicEmpresaId !== undefined) {
      return dynamicEmpresaId;
    }
    return user?.empresaId ?? null;
  }, [overrideEmpresaId, dynamicEmpresaId, user?.empresaId]);

  // Keep track of current empresa ID to detect changes
  const currentEmpresaId = useRef<string | null | undefined>(undefined);

  // Keep track of polling interval for real-time updates
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Sync manager for cross-tab communication
  const syncManager = getBrandingSyncManager();

  // Get logo URL with cache-busting parameter
  const getLogoUrl = useCallback((type: LogoType): string | null => {
    if (!currentBranding?.logos) return null;
    const logo = currentBranding.logos[type];
    if (!logo?.logoUrl) return null;

    // Add cache-busting parameter
    const url = logo.logoUrl;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${logoVersion}`;
  }, [currentBranding, logoVersion]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadBrandingData = useCallback(async (empresaId: string): Promise<CompleteBrandingConfig | null> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/tenant-branding/${empresaId}`, {
        headers
      });
      if (response.ok) {
        const branding: CompleteBrandingConfig = await response.json();
        return branding;
      } else if (response.status === 404) {
        // No custom branding found - this is not an error
        return null;
      } else {
        throw new Error(`Failed to load branding: ${response.statusText}`);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error loading branding');
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    if (!user?.empresaId) return;

    setLoadingBranding(true);
    setError(null);

    try {
      const branding = await loadBrandingData(user.empresaId);

      if (branding) {
        setCurrentBranding(branding);
        // Increment logo version for cache-busting on any branding update
        setLogoVersion(Date.now());
        applyBrandingToTheme(branding);

        // Broadcast update to other tabs
        if (user?.empresaId) {
          syncManager.broadcastBrandingUpdate(user.empresaId, branding);
          syncManager.setLastSyncTimestamp(user.empresaId, Date.now());
        }
      } else {
        // No custom branding - reset to defaults
        setCurrentBranding(null);
        setLogoVersion(Date.now());
        resetBrandingToDefaults();

        // Broadcast reset to other tabs
        if (user?.empresaId) {
          syncManager.broadcastBrandingReset(user.empresaId);
        }
      }
    } catch (err) {
      console.error('Failed to load tenant branding:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load brand customization';
      setError(errorMessage);

      // Broadcast error to other tabs
      if (user?.empresaId) {
        syncManager.broadcastBrandingError(user.empresaId, errorMessage);
      }

      // Reset to defaults on error
      setCurrentBranding(null);
      resetBrandingToDefaults();
    } finally {
      setLoadingBranding(false);
    }
  }, [user?.empresaId, loadBrandingData, applyBrandingToTheme, resetBrandingToDefaults, syncManager]);

  /**
   * Load branding for a specific empresa ID (for multi-org students).
   * Pass null to reset to default theme (for "All Organizations" view).
   */
  const loadBrandingForEmpresa = useCallback(async (empresaId: string | null) => {
    setDynamicEmpresaId(empresaId);

    if (empresaId === null) {
      // Reset to default theme for "All Organizations" view
      setCurrentBranding(null);
      setLogoVersion(Date.now());
      resetBrandingToDefaults();
      return;
    }

    setLoadingBranding(true);
    setError(null);

    try {
      const branding = await loadBrandingData(empresaId);

      if (branding) {
        setCurrentBranding(branding);
        setLogoVersion(Date.now());
        applyBrandingToTheme(branding);
      } else {
        // No custom branding for this empresa - reset to defaults
        setCurrentBranding(null);
        setLogoVersion(Date.now());
        resetBrandingToDefaults();
      }
    } catch (err) {
      console.error('Failed to load branding for empresa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load brand customization';
      setError(errorMessage);
      setCurrentBranding(null);
      resetBrandingToDefaults();
    } finally {
      setLoadingBranding(false);
    }
  }, [loadBrandingData, applyBrandingToTheme, resetBrandingToDefaults]);

  // Setup real-time updates polling
  const setupRealTimeUpdates = useCallback((empresaId: string) => {
    // Clear existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Setup new polling interval (every 30 seconds)
    pollingInterval.current = setInterval(async () => {
      try {
        const branding = await loadBrandingData(empresaId);

        // Only update if branding has changed
        if (JSON.stringify(branding) !== JSON.stringify(currentBranding)) {
          if (branding) {
            setCurrentBranding(branding);
            applyBrandingToTheme(branding);
          } else {
            setCurrentBranding(null);
            resetBrandingToDefaults();
          }
        }
      } catch (err) {
        // Silently handle polling errors to avoid spamming the user
        console.warn('Failed to poll for branding updates:', err);
      }
    }, 30000); // 30 seconds
  }, [loadBrandingData, currentBranding, applyBrandingToTheme, resetBrandingToDefaults]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Handle user changes and initial load
  useEffect(() => {
    const empresaId = user?.empresaId;

    // If empresa ID changed or user logged out
    if (currentEmpresaId.current !== empresaId) {
      currentEmpresaId.current = empresaId;

      // Update sync manager
      syncManager.setCurrentEmpresa(empresaId || null);

      // Clear existing polling
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }

      if (empresaId) {
        // Load branding for new empresa
        refreshBranding();

        // Setup real-time updates
        setupRealTimeUpdates(empresaId);
      } else {
        // User logged out - reset to defaults
        setCurrentBranding(null);
        setError(null);
        setLoadingBranding(false);
        resetBrandingToDefaults();
      }
    }
  }, [user?.empresaId, refreshBranding, setupRealTimeUpdates, resetBrandingToDefaults, syncManager]);

  // Listen for sync manager events
  useEffect(() => {
    const unsubscribe = syncManager.addListener((event) => {
      if (event.empresaId === user?.empresaId) {
        switch (event.type) {
          case 'branding-updated':
            if (event.data) {
              setCurrentBranding(event.data);
              applyBrandingToTheme(event.data);
            }
            break;
          case 'branding-reset':
            setCurrentBranding(null);
            resetBrandingToDefaults();
            break;
          case 'branding-error':
            if (event.error) {
              setError(event.error);
            }
            break;
        }
      }
    });

    return unsubscribe;
  }, [user?.empresaId, applyBrandingToTheme, resetBrandingToDefaults, syncManager]);

  // Listen for storage events to sync across tabs (fallback)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tenant-branding-update' && user?.empresaId) {
        // Another tab updated the branding - refresh
        refreshBranding();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshBranding, user?.empresaId]);

  // Provide method to trigger cross-tab updates
  const triggerCrossTabUpdate = useCallback(() => {
    if (user?.empresaId && currentBranding) {
      syncManager.broadcastBrandingUpdate(user.empresaId, currentBranding);
    }
  }, [user?.empresaId, currentBranding, syncManager]);

  // Add the trigger to the context (for use by brand customization components)
  const contextValue = React.useMemo(() => ({
    loadingBranding,
    error,
    currentBranding,
    refreshBranding,
    clearError,
    triggerCrossTabUpdate,
    logoVersion,
    getLogoUrl,
    loadBrandingForEmpresa,
    activeEmpresaId: effectiveEmpresaId,
  }), [loadingBranding, error, currentBranding, refreshBranding, clearError, triggerCrossTabUpdate, logoVersion, getLogoUrl, loadBrandingForEmpresa, effectiveEmpresaId]);

  return (
    <TenantBrandingContext.Provider value={contextValue}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}