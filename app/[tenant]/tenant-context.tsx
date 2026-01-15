'use client';

import React, { createContext, useContext } from 'react';

interface TenantContextType {
  empresaId: string;
  empresaSlug: string;
  empresaNome: string;
}

const TenantContext = createContext<TenantContextType | null>(null);

interface TenantContextProviderProps {
  children: React.ReactNode;
  empresaId: string;
  empresaSlug: string;
  empresaNome: string;
}

export function TenantContextProvider({
  children,
  empresaId,
  empresaSlug,
  empresaNome,
}: TenantContextProviderProps) {
  return (
    <TenantContext.Provider value={{ empresaId, empresaSlug, empresaNome }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantContextProvider');
  }
  return context;
}

export function useOptionalTenantContext() {
  return useContext(TenantContext);
}
