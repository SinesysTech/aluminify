"use client";

import { useEffect, ReactNode } from "react";
import { useBranding } from "./branding-data-provider";
import { BrandingSync } from "../services/branding-sync";

interface BrandingSyncProviderProps {
    children: ReactNode;
    empresaId: string;
}

export function BrandingSyncProvider({ children, empresaId }: BrandingSyncProviderProps) {
    const { refresh, service } = useBranding();

    useEffect(() => {
        // We create a local sync instance just for subscribing if service doesn't expose one directly publicly
        // But wait, BrandingService has private `sync`.
        // I should probably expose `subscribe` on BrandingService or use BrandingSync directly.
        // Since BrandingService is responsible for sync, better to use it if exposed.
        // However, BrandingService currently doesn't expose `sync` property publicly.
        // It exposes nothing about sync except that it happens on save.
        // BUT! I added `BrandingSync` class usage in BrandingService. 
        // I need a way to subscribe. BrandingService doesn't have a subscribe method.
        // I should instantiate BrandingSync here or update BrandingService to allow subscription.

        // Better approach: BrandingService should probably be the only one managing Sync to keep it encapsulated?
        // Or simpler: Just use BrandingSync class directly here since it uses BroadcastChannel which is decoupled.
        // Yes, BroadcastChannel is decoupled by channel name. 

        const sync = new BrandingSync();

        const unsubscribe = sync.subscribe((message) => {
            if (message.empresaId === empresaId) {
                if (message.type === 'invalidate' || message.type === 'update') {
                    // If update contains data, we could potentially set it directly, but refreshing is safer to ensure consistency
                    // optimization: if message.data (CompleteBrandingConfig) is present, use it.
                    // BrandingSync.publishUpdate sends data.
                    // But BrandingSync interface for subscribe gives me `BrandingSyncMessage`.
                    // Let's check `branding-sync.ts`.

                    refresh();
                }
            }
        });

        return () => {
            unsubscribe();
            sync.close();
        };
    }, [empresaId, refresh]);

    return <>{children}</>;
}
