'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Buscar empresa do usuário
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      if (userData.empresaId) {
        // Buscar admins
        const adminsResponse = await fetch(`/api/empresas/${userData.empresaId}/admins`);
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json();
          setAdmins(adminsData);
        }

        // Buscar professores
        const professoresResponse = await fetch(`/api/empresas/${userData.empresaId}/professores`);
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
  }

  async function handleAddAdmin() {
    if (!selectedProfessor) return;

    try {
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      const response = await fetch(`/api/empresas/${userData.empresaId}/admins`, {
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
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      const response = await fetch(`/api/empresas/${userData.empresaId}/admins/${userId}`, {
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Administradores da Empresa</CardTitle>
              <CardDescription>
                Gerencie os administradores da sua empresa
              </CardDescription>
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
                          {prof.fullName} ({prof.email})
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
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}

