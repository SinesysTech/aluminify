'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/client';

interface Professor {
  id: string;
  email: string;
  nome_completo: string;
  is_admin: boolean;
  empresa_id: string;
  empresas?: {
    nome: string;
  };
  created_at: string;
}

export default function ProfessoresPage() {
  const { toast } = useToast();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfessores = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }

      const response = await fetch('/api/admin/all-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfessores(data);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao carregar professores',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching professores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar professores',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProfessores();
      setLoading(false);
    };
    loadData();
  }, [fetchProfessores]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.map((prof) => (
              <TableRow key={prof.id}>
                <TableCell className="font-medium">{prof.nome_completo}</TableCell>
                <TableCell>{prof.email}</TableCell>
                <TableCell>{prof.empresas?.nome || 'N/A'}</TableCell>
                <TableCell>
                  {prof.is_admin ? (
                    <Badge variant="default">Sim</Badge>
                  ) : (
                    <Badge variant="secondary">Não</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

