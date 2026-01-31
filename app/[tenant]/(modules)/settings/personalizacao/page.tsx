'use client'

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/app/shared/core/client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { BrandCustomizationPanel } from '@/app/[tenant]/(modules)/settings/personalizacao/components';
import type { CompleteBrandingConfig, SaveTenantBrandingRequest } from '@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization.types';

export default function BrandingPage() {
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBranding, setCurrentBranding] = useState<CompleteBrandingConfig | undefined>(undefined);

  // Fetch empresa ID from user profile
  const fetchEmpresaId = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const profileResponse = await fetch('/api/usuario/perfil', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      const userData = await profileResponse.json();

      if (userData.empresaId) {
        setEmpresaId(userData.empresaId);
      }
    } catch (error) {
      console.error('Error fetching empresa ID:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmpresaId();
  }, [fetchEmpresaId]);

  // Fetch branding when empresaId is available
  const fetchBranding = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`/api/empresa/personalizacao/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const brandingResponse = await response.json();
        // Extract the data from the API response structure
        if (brandingResponse.success && brandingResponse.data) {
          setCurrentBranding(brandingResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
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
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/empresa/personalizacao/${empresaId}`, {
        method: 'POST',
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

      const saveResponse = await response.json();
      // Extract the data from the API response structure
      if (saveResponse.success && saveResponse.data) {
        setCurrentBranding(saveResponse.data);
      }

      toast({
        title: 'Sucesso',
        description: 'Personalização de marca salva com sucesso',
      });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar personalização',
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
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/empresa/personalizacao/${empresaId}`, {
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
        description: 'Personalização de marca resetada para o padrão',
      });
    } catch (error) {
      console.error('Error resetting branding:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao resetar personalização',
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
      <div className="container mx-auto py-8">
        <CardSkeleton count={1} />
      </div>
    );
  }

  if (!empresaId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
            <CardDescription>
              Seu usuário não está vinculado a uma empresa.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="page-title">Personalização da Marca</h1>
        <p className="page-subtitle">
          Personalize a identidade visual e tema da sua empresa: logos, cores, fontes e layout
        </p>
      </div>
      <BrandCustomizationPanel
        empresaId={empresaId}
        currentBranding={currentBranding}
        onSave={handleBrandingSave}
        onReset={handleBrandingReset}
        onCancel={handleBrandingCancel}
      />
    </div>
  );
}