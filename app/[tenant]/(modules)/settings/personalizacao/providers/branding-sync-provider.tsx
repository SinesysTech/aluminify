"use client";

import { useEffect, ReactNode } from "react";
import { useBranding } from "./branding-data-provider";
import { BrandingSync } from "../services/branding-sync";

interface BrandingSyncProviderProps {
    children: ReactNode;
}

export function BrandingSyncProvider({ children }: BrandingSyncProviderProps) {
    const { refresh, activeEmpresaId } = useBranding();

    useEffect(() => {
        if (!activeEmpresaId) return;

        const sync = new BrandingSync();

        const unsubscribe = sync.subscribe((message) => {
            if (message.empresaId === activeEmpresaId) {
                if (message.type === 'INVALIDATE' || message.type === 'UPDATE') {
                    refresh();
                }
            }
        });

        return () => {
            unsubscribe();
            sync.close();
        };
    }, [activeEmpresaId, refresh]);

    return <>{children}</>;
}
