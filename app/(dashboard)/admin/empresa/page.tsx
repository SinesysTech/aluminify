'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatBRPhone, formatCNPJ } from '@/lib/br';
import { createClient } from '@/lib/client';
import Link from 'next/link';
import { CardSkeleton } from '@/components/ui/card-skeleton';

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  emailContato: string | null;
  telefone: string | null;
  logoUrl: string | null;
  plano: 'basico' | 'profissional' | 'enterprise';
  ativo: boolean;
}

export default function EmpresaPage() {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
  });

  const fetchEmpresa = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Buscar empresa do usuário logado
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }
      const userData = await profileResponse.json();
      
      if (userData.empresaId) {
        const empresaResponse = await fetch(`/api/empresas/${userData.empresaId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (empresaResponse.ok) {
          const empresaData = await empresaResponse.json();
          setEmpresa(empresaData);
          // Formatar CNPJ se existir
          const cnpjFormatted = empresaData.cnpj ? formatCNPJ(empresaData.cnpj) : '';
          setFormData({
            nome: empresaData.nome || '',
            cnpj: cnpjFormatted,
            emailContato: empresaData.emailContato || '',
            telefone: empresaData.telefone || '',
          });
        } else {
          const errorData = await empresaResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('Erro ao buscar empresa:', errorData);
          throw new Error(errorData.error || 'Erro ao carregar dados da empresa');
        }
      }
    } catch (error) {
      console.error('Error fetching empresa:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmpresa();
  }, [fetchEmpresa]);

  async function handleSave() {
    if (!empresa) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Preparar payload - normalizar CNPJ antes de enviar
      const payload: Record<string, unknown> = {
        nome: formData.nome.trim(),
        emailContato: formData.emailContato?.trim() || undefined,
        telefone: formData.telefone?.trim() || undefined,
      };
      
      // Normalizar CNPJ se preenchido
      if (formData.cnpj && formData.cnpj.trim()) {
        const cnpjClean = formData.cnpj.replace(/\D/g, '');
        if (cnpjClean.length === 14) {
          // Verificar se todos os dígitos são iguais
          if (!/^(\d)\1+$/.test(cnpjClean)) {
            payload.cnpj = cnpjClean;
          } else {
            toast({
              title: 'Erro',
              description: 'CNPJ inválido: todos os dígitos são iguais',
              variant: 'destructive',
            });
            setSaving(false);
            return;
          }
        } else if (cnpjClean.length > 0) {
          toast({
            title: 'Erro',
            description: 'CNPJ deve ter 14 dígitos',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      const response = await fetch(`/api/empresas/${empresa.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao salvar');
      }

      const updated = await response.json();
      setEmpresa(updated);
      toast({
        title: 'Sucesso',
        description: 'Dados da empresa atualizados com sucesso',
      });
    } catch (error) {
      console.error('Error saving empresa:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="container mx-auto py-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
            <CardDescription>
              Seu usuário ainda não está vinculado a uma empresa. Para continuar, crie sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/professor/empresa/nova">Criar Empresa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Empresa</CardTitle>
          <CardDescription>
            Gerencie as informações básicas da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Empresa</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => {
                // Normalizar para apenas dígitos e formatar
                const digits = e.target.value.replace(/\D/g, '');
                const formatted = formatCNPJ(digits);
                setFormData({ ...formData, cnpj: formatted });
              }}
              inputMode="numeric"
              maxLength={18}
              placeholder="00.000.000/0000-00"
              pattern="^[0-9./-]*$"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailContato">Email de Contato</Label>
            <Input
              id="emailContato"
              type="email"
              value={formData.emailContato}
              onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formatBRPhone(formData.telefone)}
              onChange={(e) => setFormData({ ...formData, telefone: formatBRPhone(e.target.value) })}
              inputMode="numeric"
              maxLength={15}
              placeholder="(11) 99999-9999"
              pattern="^[0-9()\\s+-]*$"
            />
          </div>

          <div className="space-y-2">
            <Label>Plano</Label>
            <div className="text-sm text-muted-foreground capitalize">
              {empresa.plano}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brand Customization Section */}
      <Card>
        <CardHeader>
          <CardTitle>Personalização da Marca</CardTitle>
          <CardDescription>
            Personalize a identidade visual da sua empresa: logos, cores e fontes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandCustomizationPanel
            empresaId={empresa.id}
            currentBranding={currentBranding}
            onSave={handleBrandingSave}
            onReset={handleBrandingReset}
            onCancel={handleBrandingCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

