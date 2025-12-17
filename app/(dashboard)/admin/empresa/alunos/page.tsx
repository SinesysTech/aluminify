'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Aluno {
  id: string;
  fullName: string | null;
  email: string;
  courses: Array<{ id: string; name: string }>;
}

export default function EmpresaAlunosPage() {
  const { toast } = useToast();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlunos = useCallback(async () => {
    try {
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      if (userData.empresaId) {
        const response = await fetch(`/api/empresas/${userData.empresaId}/alunos`);
        if (response.ok) {
          const data = await response.json();
          setAlunos(data);
        }
      }
    } catch (error) {
      console.error('Error fetching alunos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alunos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Alunos da Empresa</CardTitle>
          <CardDescription>
            Alunos matriculados em cursos da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                className="p-4 border rounded-lg"
              >
                <div className="font-medium">{aluno.fullName || 'Sem nome'}</div>
                <div className="text-sm text-muted-foreground">{aluno.email}</div>
                <div className="mt-2">
                  <div className="text-sm font-medium">Cursos:</div>
                  <div className="text-sm text-muted-foreground">
                    {aluno.courses.length > 0
                      ? aluno.courses.map((c) => c.name).join(', ')
                      : 'Nenhum curso'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

