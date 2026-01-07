"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useThemeConfig } from '@/components/active-theme';

interface User {
  empresaId?: string;
  // Add other user properties as needed
}

interface TenantBrandingContextType {
  loadingBranding: boolean;
  error: string | null;
}

const TenantBrandingContext = createContext<TenantBrandingContextType>({
  loadingBranding: false,
  error: null,
});

interface TenantBrandingProviderProps {
  children: React.ReactNode;
  user?: User | null;
}

export function TenantBrandingProvider({ children, user }: TenantBrandingProviderProps) {
  const { loadTenantBranding } = useThemeConfig();
  const [loadingBranding, setLoadingBranding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (user?.empresaId) {
      setLoadingBranding(true);
      setError(null);
      
      loadTenantBranding(user.empresaId)
        .catch((err) => {
          console.error('Failed to load tenant branding:', err);
          setError('Failed to load brand customization');
        })
        .finally(() => {
          setLoadingBranding(false);
        });
    }
  }, [user?.empresaId, loadTenantBranding]);

  return (
    <TenantBrandingContext.Provider value={{ loadingBranding, error }}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}