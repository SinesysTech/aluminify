'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/shared/core/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { formatBRPhone, formatCNPJ, isValidCNPJ } from '@/shared/library/br';
import { useCurrentUser } from '@/components/providers/user-provider';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  emailContato: string | null;
  telefone: string | null;
}

export default function CompletarCadastroEmpresaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
  });

  // Carregar dados da empresa ao montar
  useEffect(() => {
    async function loadEmpresa() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Tentar obter empresaId de múltiplas fontes
        let empresaIdToUse = user?.empresaId;

        // Se não tiver empresaId do user context, tentar buscar do metadata ou da tabela professores
        if (!empresaIdToUse) {
          const { data: { user: authUser } } = await supabase.auth.getUser();

          // Tentar do metadata primeiro
          empresaIdToUse = authUser?.user_metadata?.empresa_id;

          // Se ainda não tiver, buscar da tabela professores
          if (!empresaIdToUse && authUser?.id) {
            // Aguardar um pouco para garantir que o registro do professor foi criado
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: professor } = await supabase
              .from('professores')
              .select('empresa_id')
              .eq('id', authUser.id)
              .maybeSingle();

            if (professor?.empresa_id) {
              empresaIdToUse = professor.empresa_id;
            }
          }
        }

        if (!empresaIdToUse) {
          toast({
            title: 'Erro',
            description: 'Você não está vinculado a uma empresa. Entre em contato com o suporte.',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }

        // Buscar dados da empresa
        const response = await fetch(`/api/empresas/${empresaIdToUse}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('Erro ao carregar empresa:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            empresaId: empresaIdToUse,
          });
          throw new Error(errorData.error || `Erro ao carregar dados da empresa (${response.status})`);
        }

        const empresaData = await response.json();

        // Verificar se empresa já está completa (se tiver pelo menos um dos campos)
        // Campos podem ser null, undefined ou string vazia
        const temCnpj = empresaData.cnpj && empresaData.cnpj.trim() !== '';
        const temEmail = empresaData.emailContato && empresaData.emailContato.trim() !== '';
        const temTelefone = empresaData.telefone && empresaData.telefone.trim() !== '';
        const empresaCompleta = temCnpj || temEmail || temTelefone;

        if (empresaCompleta) {
          // Se empresa já está completa, redirecionar para dashboard
          toast({
            title: 'Informação',
            description: 'O cadastro da empresa já está completo.',
          });
          router.push('/empresa/dashboard');
          return;
        }

        setEmpresa(empresaData);
        // Formatar CNPJ se existir, senão string vazia
        const cnpjFormatted = empresaData.cnpj ? formatCNPJ(empresaData.cnpj) : '';
        setFormData({
          nome: empresaData.nome || '',
          cnpj: cnpjFormatted,
          emailContato: empresaData.emailContato || '',
          telefone: empresaData.telefone || '',
        });
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados da empresa',
          variant: 'destructive',
        });
      } finally {
        setChecking(false);
      }
    }

    loadEmpresa();
  }, [user, router, toast]);

  async function handleComplete() {
    if (!empresa) return;

    // Validação básica
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da empresa é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Preparar dados para atualização
      // CNPJ é opcional - só enviar se preenchido e válido
      // Normalizar CNPJ removendo máscara antes de enviar
      let cnpjToSend: string | undefined = undefined;
      if (formData.cnpj && formData.cnpj.trim()) {
        // Remover todos os caracteres não numéricos
        const cnpjClean = formData.cnpj.replace(/\D/g, '');

        // Só enviar se tiver exatamente 14 dígitos E não for todos iguais
        if (cnpjClean.length === 14) {
          // Verificar se todos os dígitos são iguais (CNPJ inválido)
          if (/^(\d)\1+$/.test(cnpjClean)) {
            toast({
              title: 'Erro',
              description: 'CNPJ inválido: todos os dígitos são iguais. Por favor, informe um CNPJ válido ou deixe o campo vazio.',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }

          // Validar dígitos verificadores
          if (!isValidCNPJ(cnpjClean)) {
            toast({
              title: 'Erro',
              description: 'CNPJ inválido: dígitos verificadores incorretos. Por favor, verifique o CNPJ ou deixe o campo vazio.',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }

          cnpjToSend = cnpjClean;
        } else if (cnpjClean.length > 0) {
          // Se preencheu mas não tem 14 dígitos, mostrar erro antes de enviar
          toast({
            title: 'Erro',
            description: 'CNPJ deve ter 14 dígitos',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      const payload: Record<string, unknown> = {
        nome: formData.nome.trim(),
        emailContato: formData.emailContato?.trim() || undefined,
        telefone: formData.telefone?.trim() || undefined,
      };

      // Só incluir CNPJ no payload se foi preenchido e validado
      if (cnpjToSend !== undefined) {
        payload.cnpj = cnpjToSend;
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
        throw new Error(errorData.error || 'Erro ao atualizar empresa');
      }

      toast({
        title: 'Sucesso',
        description: 'Cadastro da empresa completado com sucesso!',
      });

      // Redirecionar para dashboard da empresa
      setTimeout(() => {
        router.push('/empresa/dashboard');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Erro ao completar cadastro:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao completar cadastro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="container mx-auto py-8 max-w-xl">
        <div className="rounded-md border p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="container mx-auto py-8 max-w-xl">
        <div className="space-y-2">
          <h1 className="page-title">Empresa não encontrada</h1>
          <p className="page-subtitle">
            Não foi possível carregar os dados da sua empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-xl space-y-6">
      <div>
        <h1 className="page-title">Completar Cadastro da Empresa</h1>
        <p className="page-subtitle">
          Complete as informações da sua empresa para continuar usando a plataforma.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da Empresa *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
            disabled={loading}
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
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Se informar, deve ter 14 dígitos.
          </p>
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
            value={formatBRPhone(formData.telefone)}
            onChange={(e) => setFormData({ ...formData, telefone: formatBRPhone(e.target.value) })}
            inputMode="numeric"
            maxLength={15}
            placeholder="(11) 99999-9999"
            pattern="^[0-9()\\s+-]*$"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? 'Salvando...' : 'Completar Cadastro'}
          </Button>
        </div>
      </div>
    </div>
  );
}

