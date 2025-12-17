'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();
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

  useEffect(() => {
    fetchEmpresa();
  }, []);

  async function fetchEmpresa() {
    try {
      // Buscar empresa do usuário logado
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }
      const userData = await response.json();
      
      if (userData.empresaId) {
        const empresaResponse = await fetch(`/api/empresas/${userData.empresaId}`);
        if (empresaResponse.ok) {
          const empresaData = await empresaResponse.json();
          setEmpresa(empresaData);
          setFormData({
            nome: empresaData.nome || '',
            cnpj: empresaData.cnpj || '',
            emailContato: empresaData.emailContato || '',
            telefone: empresaData.telefone || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!empresa) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/empresas/${empresa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar');
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
        description: 'Erro ao salvar dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!empresa) {
    return <div>Empresa não encontrada</div>;
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
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
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
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
    </div>
  );
}

