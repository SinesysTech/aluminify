"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/app/shared/core/client";
import type { VisibleModule } from "@/app/[tenant]/(modules)/empresa/services/module-visibility.types";

/**
 * Context type for module visibility
 */
export interface ModuleVisibilityContextType {
  /** List of visible modules for the current tenant */
  modules: VisibleModule[];
  /** Whether modules are being loaded */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Refresh modules from server */
  refresh: () => Promise<void>;
}

export const ModuleVisibilityContext = createContext<ModuleVisibilityContextType>({
  modules: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

interface ModuleVisibilityProviderProps {
  children: React.ReactNode;
  /** The empresa ID to load module visibility for */
  empresaId: string | null;
  /** User role - only loads visibility for students ("aluno") */
  userRole?: string;
}

export function ModuleVisibilityProvider({
  children,
  empresaId,
  userRole,
}: ModuleVisibilityProviderProps) {
  const [modules, setModules] = useState<VisibleModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    // Only fetch for students
    if (!empresaId || userRole !== "aluno") {
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/empresa/module-visibility/${empresaId}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No configuration exists - use empty array (will fallback to defaults)
          setModules([]);
          return;
        }
        throw new Error(`Failed to fetch module visibility: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.modules)) {
        setModules(data.modules);
      } else {
        // No configuration - will use defaults in sidebar
        setModules([]);
      }
    } catch (err) {
      console.error("Failed to fetch module visibility:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load module configuration"
      );
      // On error, use empty array - sidebar will fallback to defaults
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId, userRole]);

  // Fetch modules when empresaId or userRole changes
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const contextValue = useMemo(
    () => ({
      modules,
      loading,
      error,
      refresh: fetchModules,
    }),
    [modules, loading, error, fetchModules]
  );

  return (
    <ModuleVisibilityContext.Provider value={contextValue}>
      {children}
    </ModuleVisibilityContext.Provider>
  );
}

/**
 * Hook to access module visibility context
 */
export function useModuleVisibilityContext() {
  const context = useContext(ModuleVisibilityContext);
  if (!context) {
    throw new Error(
      "useModuleVisibilityContext must be used within ModuleVisibilityProvider"
    );
  }
  return context;
}
