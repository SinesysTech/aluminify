'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/components/providers/user-provider';

export default function ProfessorNovaEmpresaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
  });

  // Verificar se o professor jÃ¡ tem empresa ao carregar a pÃ¡gina
  useEffect(() => {
    async function checkEmpresa() {
      if (user?.empresaId) {
        // JÃ¡ tem empresa, redirecionar
        toast({
          title: 'VocÃª jÃ¡ tem uma empresa',
          description: 'Redirecionando para a pÃ¡gina da sua empresa...',
        });
        setTimeout(() => {
          router.push('/admin/empresa');
        }, 1500);
        return;
      }

      // Verificar diretamente no banco
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: professor } = await supabase
            .from('professores')
            .select('empresa_id')
            .eq('id', authUser.id)
            .maybeSingle();

          if (professor?.empresa_id) {
            toast({
              title: 'VocÃª jÃ¡ tem uma empresa',
              description: 'Redirecionando para a pÃ¡gina da sua empresa...',
            });
            setTimeout(() => {
              router.push('/admin/empresa');
            }, 1500);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar empresa:', error);
      } finally {
        setChecking(false);
      }
    }

    checkEmpresa();
  }, [user, router, toast]);

  async function handleCreateEmpresa() {
    console.log('[Criar Empresa] Iniciando criaÃ§Ã£o...', { formData });

    // ValidaÃ§Ã£o bÃ¡sica
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da empresa Ã© obrigatÃ³rio',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Criar Empresa] Erro ao obter sessÃ£o:', sessionError);
        throw new Error('Erro ao verificar sessÃ£o. FaÃ§a login novamente.');
      }

      if (!session) {
        console.error('[Criar Empresa] SessÃ£o nÃ£o encontrada');
        throw new Error('SessÃ£o expirada. FaÃ§a login novamente.');
      }

      console.log('[Criar Empresa] SessÃ£o vÃ¡lida, processando dados...');

      const cnpjDigits = formData.cnpj.replace(/\D/g, '');
      const cnpjToSend = cnpjDigits.length === 0 ? undefined : cnpjDigits;

      if (cnpjToSend && cnpjToSend.length !== 14) {
        throw new Error('CNPJ deve ter 14 dÃ­gitos (ou deixe em branco)');
      }
      if (cnpjToSend && /^(\d)\1+$/.test(cnpjToSend)) {
        throw new Error('CNPJ invÃ¡lido');
      }

      const payload = {
        nome: formData.nome.trim(),
        cnpj: cnpjToSend,
        emailContato: formData.emailContato?.trim() || undefined,
        telefone: formData.telefone?.trim() || undefined,
      };

      console.log('[Criar Empresa] Enviando requisiÃ§Ã£o...', payload);

      const response = await fetch('/api/empresas/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('[Criar Empresa] Resposta recebida:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('[Criar Empresa] Erro na API:', err);

        // Se o erro for 409 (jÃ¡ tem empresa), redirecionar
        if (response.status === 409) {
          toast({
            title: 'VocÃª jÃ¡ tem uma empresa',
            description: 'Redirecionando para a pÃ¡gina da sua empresa...',
          });
          setTimeout(() => {
            router.push('/admin/empresa');
            router.refresh();
          }, 1500);
          return;
        }

        throw new Error(err.error || `Erro ao criar empresa (${response.status})`);
      }

      const result = await response.json();
      console.log('[Criar Empresa] Sucesso:', result);

      toast({
        title: 'Sucesso',
        description: 'Empresa criada e vinculada ao seu usuÃ¡rio.',
      });

      // Aguardar um pouco para o toast aparecer antes de redirecionar
      setTimeout(() => {
        router.push('/admin/empresa');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('[Criar Empresa] Erro capturado:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao criar empresa';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="container mx-auto py-8 max-w-xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Verificando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <div className="container mx-auto py-8 max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar sua Empresa</h1>
          <p className="text-muted-foreground">
            Para continuar, crie sua empresa e vocÃª serÃ¡ definido como administrador.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Empresa *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Cursinho XYZ"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              disabled={loading}
            />
            <div className="text-xs text-muted-foreground">
              Opcional. Se informar, deve ter 14 dÃ­gitos.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailContato">Email de Contato</Label>
            <Input
              id="emailContato"
              type="email"
              value={formData.emailContato}
              onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
              placeholder="contato@empresa.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>

          <Button
            onClick={(e) => {
              e.preventDefault();
              console.log('[Criar Empresa] BotÃ£o clicado');
              handleCreateEmpresa();
            }}
            className="w-full"
            disabled={loading || !formData.nome.trim()}
            type="button"
          >
            {loading ? 'Criando...' : 'Criar Empresa'}
          </Button>
        </div>
      </div>
    </div>
  );
}

