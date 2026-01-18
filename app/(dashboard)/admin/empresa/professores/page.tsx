'use client'

import { useCallback, useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Professor {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
}

export default function EmpresaProfessoresPage() {
  const { toast } = useToast();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    isAdmin: false,
  });

  const fetchProfessores = useCallback(async () => {
    try {
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      if (userData.empresaId) {
        const response = await fetch(`/api/empresas/${userData.empresaId}/professores`);
        if (response.ok) {
          const data = await response.json();
          setProfessores(data);
        }
      }
    } catch (error) {
      console.error('Error fetching professores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar professores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfessores();
  }, [fetchProfessores]);

  async function handleCreate() {
    try {
      const userResponse = await fetch('/api/user/profile');
      const userData = await userResponse.json();
      
      const response = await fetch(`/api/empresas/${userData.empresaId}/professores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar professor');
      }

      toast({
        title: 'Sucesso',
        description: 'Professor criado com sucesso',
      });
      setOpen(false);
      setFormData({ email: '', fullName: '', password: '', isAdmin: false });
      fetchProfessores();
    } catch (error) {
      console.error('Error creating professor:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar professor',
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
              <CardTitle>Professores da Empresa</CardTitle>
              <CardDescription>
                Gerencie os professores da sua empresa
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Adicionar Professor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Professor</DialogTitle>
                  <DialogDescription>
                    Crie uma nova conta de professor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha TemporÃ¡ria</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={formData.isAdmin}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isAdmin: checked === true })
                      }
                    />
                    <Label htmlFor="isAdmin">Ã‰ administrador?</Label>
                  </div>
                  <Button onClick={handleCreate}>Criar Professor</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {professores.map((prof) => (
              <div
                key={prof.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{prof.fullName}</div>
                  <div className="text-sm text-muted-foreground">{prof.email}</div>
                  {prof.isAdmin && (
                    <span className="text-xs text-primary">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

