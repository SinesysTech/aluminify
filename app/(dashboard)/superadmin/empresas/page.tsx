'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  plano: 'basico' | 'profissional' | 'enterprise';
  ativo: boolean;
  createdAt: string;
}

export default function EmpresasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = useCallback(async () => {
    try {
      const response = await fetch('/api/empresas');
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (error) {
      console.error('Error fetching empresas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, ativo: boolean) {
    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      toast({
        title: 'Sucesso',
        description: `Empresa ${!ativo ? 'ativada' : 'desativada'} com sucesso`,
      });
      fetchEmpresas();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da empresa',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>
                Gerencie todas as empresas do sistema
              </CardDescription>
            </div>
            <Link href="/superadmin/empresas/nova">
              <Button>Nova Empresa</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{empresa.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    CNPJ: {empresa.cnpj || 'Não informado'} | Plano: {empresa.plano}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criada em: {new Date(empresa.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${empresa.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {empresa.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(empresa.id, empresa.ativo)}
                  >
                    {empresa.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

