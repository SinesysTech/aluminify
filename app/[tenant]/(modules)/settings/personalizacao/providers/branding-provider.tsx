"use client";

import { ReactNode } from "react";
import { BrandingDataProvider } from "./branding-data-provider";
import { BrandingThemeProvider } from "./branding-theme-provider";
import { BrandingSyncProvider } from "./branding-sync-provider";
import type { CompleteBrandingConfig } from "../services/brand-customization.types";

interface BrandingProviderProps {
    children: ReactNode;
    empresaId: string;
    initialData?: CompleteBrandingConfig | null;
}

export function BrandingProvider({ children, empresaId, initialData }: BrandingProviderProps) {
    return (
        <BrandingDataProvider empresaId={empresaId} initialData={initialData}>
            <BrandingSyncProvider>
                <BrandingThemeProvider>
                    {children}
                </BrandingThemeProvider>
            </BrandingSyncProvider>
        </BrandingDataProvider>
    );
}

export * from "./branding-data-provider";
