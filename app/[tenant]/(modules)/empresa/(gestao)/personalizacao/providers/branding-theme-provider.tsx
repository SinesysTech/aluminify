"use client";

import { useEffect, ReactNode } from "react";
import { useBranding } from "./branding-data-provider";

interface BrandingThemeProviderProps {
    children: ReactNode;
}

export function BrandingThemeProvider({ children }: BrandingThemeProviderProps) {
    const { branding, service } = useBranding();

    useEffect(() => {
        if (branding && service) {
            service.applyTenantBranding({
                branding,
                target: 'document' // Applies to documentElement
            });
        }
    }, [branding, service]);

    return <>{children}</>;
}
