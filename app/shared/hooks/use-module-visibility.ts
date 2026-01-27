/**
 * Module Visibility Hook
 *
 * Custom hook for accessing module visibility configuration from context.
 * Used by AlunoSidebar to determine which modules should be displayed.
 */

import { useContext, useCallback, useState, useEffect } from 'react';
import {
  ModuleVisibilityContext,
  type ModuleVisibilityContextType,
} from '@/components/providers/module-visibility-provider';
import type { VisibleModule } from '@/app/[tenant]/(modules)/empresa/services/module-visibility.types';

/**
 * Hook for accessing module visibility from context
 * Must be used within ModuleVisibilityProvider
 */
export function useModuleVisibility(): ModuleVisibilityContextType {
  const context = useContext(ModuleVisibilityContext);

  if (!context) {
    throw new Error('useModuleVisibility must be used within ModuleVisibilityProvider');
  }

  return context;
}

/**
 * Optional hook that returns null when used outside of ModuleVisibilityProvider
 * Useful for components that need to work in both authenticated and unauthenticated contexts
 */
export function useModuleVisibilityOptional(): ModuleVisibilityContextType | null {
  const context = useContext(ModuleVisibilityContext);

  // Check if we have a valid context
  if (!context || !context.refresh) {
    return null;
  }

  return context;
}

/**
 * Hook for checking if a specific module is visible
 */
export function useIsModuleVisible(moduleId: string): boolean {
  const { modules, loading } = useModuleVisibility();

  // While loading, assume module is visible (show everything)
  if (loading) {
    return true;
  }

  // If no configuration, all modules are visible by default
  if (modules.length === 0) {
    return true;
  }

  return modules.some(m => m.id === moduleId);
}

/**
 * Hook for getting a specific module's configuration
 */
export function useModule(moduleId: string): VisibleModule | null {
  const { modules } = useModuleVisibility();
  return modules.find(m => m.id === moduleId) || null;
}

/**
 * Standalone hook for fetching module visibility without provider
 * Used in contexts where the provider is not available
 */
export function useModuleVisibilityStandalone(empresaId: string | null): {
  modules: VisibleModule[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [modules, setModules] = useState<VisibleModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!empresaId) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/empresa/module-visibility/${empresaId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch module visibility');
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.modules)) {
        setModules(data.modules);
      } else {
        // No configuration, will use defaults
        setModules([]);
      }
    } catch (err) {
      console.error('Error fetching module visibility:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // On error, use empty array (will fallback to defaults in sidebar)
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    modules,
    loading,
    error,
    refresh: fetchModules,
  };
}
