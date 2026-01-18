'use client'

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/client';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { BrandCustomizationPanel } from '@/components/brand-customization';
import type { CompleteBrandingConfig, SaveTenantBrandingRequest } from '@/types/brand-customization';

interface BrandingSettingsProps {
    empresaId: string;
}

export function BrandingSettings({ empresaId }: BrandingSettingsProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentBranding, setCurrentBranding] = useState<CompleteBrandingConfig | undefined>(undefined);

    // Fetch branding when empresaId is available
    const fetchBranding = useCallback(async (id: string) => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) return;

            const response = await fetch(`/api/tenant-branding/${id}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const brandingData = await response.json();
                setCurrentBranding(brandingData);
            }
        } catch (error) {
            console.error('Error fetching branding:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (empresaId) {
            fetchBranding(empresaId);
        }
    }, [empresaId, fetchBranding]);

    // Branding handlers
    const handleBrandingSave = async (request: SaveTenantBrandingRequest) => {
        if (!empresaId) return;

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('SessÃ£o expirada. FaÃ§a login novamente.');
            }

            const response = await fetch(`/api/tenant-branding/${empresaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || 'Erro ao salvar branding');
            }

            const updatedBranding = await response.json();
            setCurrentBranding(updatedBranding);

            toast({
                title: 'Sucesso',
                description: 'PersonalizaÃ§Ã£o de marca salva com sucesso',
            });
        } catch (error) {
            console.error('Error saving branding:', error);
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao salvar personalizaÃ§Ã£o',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleBrandingReset = async () => {
        if (!empresaId) return;

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('SessÃ£o expirada. FaÃ§a login novamente.');
            }

            const response = await fetch(`/api/tenant-branding/${empresaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || 'Erro ao resetar branding');
            }

            setCurrentBranding(undefined);

            toast({
                title: 'Sucesso',
                description: 'PersonalizaÃ§Ã£o de marca resetada para o padrÃ£o',
            });
        } catch (error) {
            console.error('Error resetting branding:', error);
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao resetar personalizaÃ§Ã£o',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleBrandingCancel = () => {
        if (empresaId) {
            fetchBranding(empresaId);
        }
    };

    if (loading) {
        return (
            <div className="pt-6">
                <CardSkeleton count={1} />
            </div>
        );
    }

    return (
        <BrandCustomizationPanel
            empresaId={empresaId}
            currentBranding={currentBranding}
            onSave={handleBrandingSave}
            onReset={handleBrandingReset}
            onCancel={handleBrandingCancel}
        />
    );
}
