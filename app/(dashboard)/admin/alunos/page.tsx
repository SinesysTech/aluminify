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

interface Aluno {
  id: string;
  email: string;
  nomeCompleto: string | null;
  cpf: string | null;
  empresas: string[];
  cursos: Array<{
    id: string;
    nome: string;
    empresaId: string;
    empresaNome: string;
  }>;
  createdAt: string;
}

export default function AlunosPage() {
  const { toast } = useToast();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlunos = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }

      const response = await fetch('/api/admin/all-students', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlunos(data);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao carregar alunos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching alunos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alunos',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAlunos();
      setLoading(false);
    };
    loadData();
  }, [fetchAlunos]);

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
              <TableHead>Empresas</TableHead>
              <TableHead>Cursos</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">
                  {aluno.nomeCompleto || 'Sem nome'}
                </TableCell>
                <TableCell>{aluno.email}</TableCell>
                <TableCell>
                  {aluno.empresas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {aluno.empresas.map((emp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {emp}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {aluno.cursos.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {aluno.cursos.map((curso) => (
                        <Badge key={curso.id} variant="secondary" className="text-xs">
                          {curso.nome}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    'Nenhum curso'
                  )}
                </TableCell>
                <TableCell>
                  {new Date(aluno.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

