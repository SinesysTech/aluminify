"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BrandingService } from "../services/branding.service";
import type { CompleteBrandingConfig } from "../services/brand-customization.types";

interface BrandingContextType {
    branding: CompleteBrandingConfig | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    service: BrandingService | null;
    setEmpresaId: (id: string | null) => void;
    activeEmpresaId: string | null;
}

const BrandingContext = createContext<BrandingContextType>({
    branding: null,
    isLoading: true,
    error: null,
    refresh: async () => { },
    service: null,
    setEmpresaId: () => { },
    activeEmpresaId: null
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingDataProviderProps {
    children: ReactNode;
    empresaId: string;
    initialData?: CompleteBrandingConfig | null;
}

export function BrandingDataProvider({ children, empresaId, initialData = null }: BrandingDataProviderProps) {
    const [customEmpresaId, setCustomEmpresaId] = useState<string | null | undefined>(undefined);
    const effectiveEmpresaId = customEmpresaId !== undefined ? customEmpresaId : empresaId;

    const [branding, setBranding] = useState<CompleteBrandingConfig | null>(initialData);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClientComponentClient();
    const service = useMemo(() => new BrandingService(supabase), [supabase]);

    const loadBranding = useCallback(async (idToLoad?: string | null) => {
        const targetId = idToLoad !== undefined ? idToLoad : effectiveEmpresaId;

        if (!service) return;

        // If targetId is null, reset to default (or clean state)
        if (!targetId) {
            setBranding(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const result = await service.loadTenantBranding({ empresaId: targetId });
            if (result.success && result.data) {
                setBranding(result.data);
                setError(null);
            } else {
                setError(result.error || "Failed to load branding");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [service, effectiveEmpresaId]);

    // Initial load and reaction to effectiveId change
    useEffect(() => {
        if (customEmpresaId === undefined && initialData) {
            setBranding(initialData);
            setIsLoading(false);
        } else {
            loadBranding(effectiveEmpresaId);
        }
    }, [loadBranding, effectiveEmpresaId, initialData, customEmpresaId]);

    const setEmpresaId = useCallback((id: string | null) => {
        setCustomEmpresaId(id);
    }, []);

    const contextValue = useMemo(() => ({
        branding,
        isLoading,
        error,
        refresh: () => loadBranding(),
        service,
        setEmpresaId,
        activeEmpresaId: effectiveEmpresaId
    }), [branding, isLoading, error, loadBranding, service, setEmpresaId, effectiveEmpresaId]);

    return (
        <BrandingContext.Provider value={contextValue}>
            {children}
        </BrandingContext.Provider>
    );
}
