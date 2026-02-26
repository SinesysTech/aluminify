'use client'

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/app/shared/core/client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { ModuleVisibilityPanel } from './components/module-visibility-panel';
import type { ModuleWithVisibility, BulkUpdateModuleVisibilityInput } from '@/app/[tenant]/(modules)/empresa/services/module-visibility.types';

export default function ModulosPage() {
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ModuleWithVisibility[] | undefined>(undefined);

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

  // Fetch module config when empresaId is available
  const fetchConfig = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`/api/empresa/module-visibility/${id}?config=true`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setConfig(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching module config:', error);
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      fetchConfig(empresaId);
    }
  }, [empresaId, fetchConfig]);

  // Save handler
  const handleSave = async (input: BulkUpdateModuleVisibilityInput) => {
    if (!empresaId) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/empresa/module-visibility/${empresaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao salvar configuração');
      }

      // Refresh config after save
      await fetchConfig(empresaId);

      toast({
        title: 'Sucesso',
        description: 'Configuração de módulos salva com sucesso',
      });
    } catch (error) {
      console.error('Error saving module config:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar configuração',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Reset handler
  const handleReset = async () => {
    if (!empresaId) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/empresa/module-visibility/${empresaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao resetar configuração');
      }

      // Refresh config after reset
      await fetchConfig(empresaId);

      toast({
        title: 'Sucesso',
        description: 'Configuração de módulos resetada para o padrão',
      });
    } catch (error) {
      console.error('Error resetting module config:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao resetar configuração',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Cancel handler
  const handleCancel = () => {
    if (empresaId) {
      fetchConfig(empresaId);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CardSkeleton count={1} />
      </div>
    );
  }

  if (!empresaId) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <ModuleVisibilityPanel
        empresaId={empresaId}
        initialConfig={config}
        onSave={handleSave}
        onReset={handleReset}
        onCancel={handleCancel}
      />
    </div>
  );
}
