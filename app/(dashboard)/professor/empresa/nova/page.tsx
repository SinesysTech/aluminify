'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ProfessorNovaEmpresaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
  });

  async function handleCreateEmpresa() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const cnpjDigits = formData.cnpj.replace(/\D/g, '');
      const cnpjToSend = cnpjDigits.length === 0 ? undefined : cnpjDigits;
      if (cnpjToSend && cnpjToSend.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos (ou deixe em branco)');
      }
      if (cnpjToSend && /^(\d)\1+$/.test(cnpjToSend)) {
        throw new Error('CNPJ inválido');
      }

      const response = await fetch('/api/empresas/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.nome,
          cnpj: cnpjToSend,
          emailContato: formData.emailContato || undefined,
          telefone: formData.telefone || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar empresa');
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa criada e vinculada ao seu usuário.',
      });

      router.push('/admin/empresa');
      router.refresh();
    } catch (error) {
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

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar sua Empresa</CardTitle>
          <CardDescription>
            Para continuar, crie sua empresa e você será definido como administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              Opcional. Se informar, deve ter 14 dígitos.
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

          <Button onClick={handleCreateEmpresa} className="w-full" disabled={loading || !formData.nome.trim()}>
            {loading ? 'Criando...' : 'Criar Empresa'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


