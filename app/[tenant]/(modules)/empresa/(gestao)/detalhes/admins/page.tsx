'use client'

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/shared/components/overlay/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/forms/select';

interface Admin {
  user_id: string;
  is_owner: boolean;
  professores: {
    nome_completo: string;
    email: string;
  };
}

export default function EmpresaAdminsPage() {
  const { toast } = useToast();
  interface Professor {
    id: string;
    nome: string;
    email: string;
    fullName?: string;
  }

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      // Buscar empresa do usuário
      const userResponse = await fetch('/api/usuario/perfil');
      const userData = await userResponse.json();

      if (userData.empresaId) {
        // Buscar admins
        const adminsResponse = await fetch(`/api/empresa/${userData.empresaId}/admins`);
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json();
          setAdmins(adminsData);
        }

        // Buscar professores
        const professoresResponse = await fetch(`/api/empresa/${userData.empresaId}/professores`);
        if (professoresResponse.ok) {
          const professoresData = await professoresResponse.json();
          setProfessores(professoresData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddAdmin() {
    if (!selectedProfessor) return;

    try {
      const userResponse = await fetch('/api/usuario/perfil');
      const userData = await userResponse.json();

      const response = await fetch(`/api/empresa/${userData.empresaId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professorId: selectedProfessor }),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar admin');
      }

      toast({
        title: 'Sucesso',
        description: 'Admin adicionado com sucesso',
      });
      setOpen(false);
      setSelectedProfessor('');
      fetchData();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar admin',
        variant: 'destructive',
      });
    }
  }

  async function handleRemoveAdmin(userId: string) {
    try {
      const userResponse = await fetch('/api/usuario/perfil');
      const userData = await userResponse.json();

      const response = await fetch(`/api/empresa/${userData.empresaId}/admins/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover admin');
      }

      toast({
        title: 'Sucesso',
        description: 'Admin removido com sucesso',
      });
      fetchData();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover admin',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  const professoresNaoAdmin = professores.filter(
    (p) => !admins.some((a) => a.user_id === p.id)
  );

  return (
    <div className="container mx-auto py-8">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Administradores da Empresa</h1>
            <p className="page-subtitle">
              Gerencie os administradores da sua empresa
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Adicionar Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Administrador</DialogTitle>
                <DialogDescription>
                  Selecione um professor para promover a administrador
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professoresNaoAdmin.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.fullName || prof.nome} ({prof.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAdmin} disabled={!selectedProfessor}>
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.user_id}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium">
                  {admin.professores?.nome_completo || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {admin.professores?.email || 'N/A'}
                </div>
                {admin.is_owner && (
                  <span className="text-xs text-primary">Owner</span>
                )}
              </div>
              {!admin.is_owner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveAdmin(admin.user_id)}
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}