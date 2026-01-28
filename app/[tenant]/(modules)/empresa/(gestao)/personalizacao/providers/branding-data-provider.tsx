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
}

const BrandingContext = createContext<BrandingContextType>({
    branding: null,
    isLoading: true,
    error: null,
    refresh: async () => { },
    service: null
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingDataProviderProps {
    children: ReactNode;
    empresaId: string;
    initialData?: CompleteBrandingConfig | null;
}

export function BrandingDataProvider({ children, empresaId, initialData = null }: BrandingDataProviderProps) {
    const [branding, setBranding] = useState<CompleteBrandingConfig | null>(initialData);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClientComponentClient();
    const service = useMemo(() => new BrandingService(supabase), [supabase]);

    const loadBranding = useCallback(async () => {
        if (!service || !empresaId) return;
        setIsLoading(true);
        try {
            const result = await service.loadTenantBranding({ empresaId });
            if (result.success && result.data) {
                setBranding(result.data);
                setError(null);
            } else {
                setError(result.error || "Failed to load branding");
                // Fallback to default if load failed? Or keep error?
                // Usually keeping error is better for debugging, but maybe we want a safe fallback.
                // The service already returns default on "not found" but "error" is for real failures.
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [service, empresaId]);

    // Initial load
    useEffect(() => {
        if (!initialData && empresaId) {
            loadBranding();
        } else if (initialData) {
            setBranding(initialData);
            setIsLoading(false);
        }
    }, [loadBranding, initialData, empresaId]);

    const contextValue = useMemo(() => ({
        branding,
        isLoading,
        error,
        refresh: loadBranding,
        service
    }), [branding, isLoading, error, loadBranding, service]);

    return (
        <BrandingContext.Provider value={contextValue}>
            {children}
        </BrandingContext.Provider>
    );
}
