'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NovaEmpresaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise',
    primeiroAdminEmail: '',
    primeiroAdminNome: '',
    primeiroAdminPassword: '',
  });

  async function handleSubmit() {
    setLoading(true);
    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar empresa');
      }

      await response.json();
      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso',
      });
      router.push(`/superadmin/empresas`);
    } catch (error) {
      console.error('Error creating empresa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar empresa';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function canProceedToNextStep() {
    switch (step) {
      case 1:
        return formData.nome.trim() !== '';
      case 2:
        return true; // Plano sempre tem um valor vÃ¡lido
      case 3:
        return (
          formData.primeiroAdminEmail.trim() !== '' &&
          formData.primeiroAdminNome.trim() !== '' &&
          formData.primeiroAdminPassword.trim() !== ''
        );
      default:
        return false;
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="container mx-auto py-8 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Nova Empresa</h1>
          <p className="text-muted-foreground">
            Passo {step} de 3: {step === 1 ? 'Dados da Empresa' : step === 2 ? 'Plano' : 'Primeiro Admin'}
          </p>
        </div>
        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Cursinho XYZ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailContato">Email de Contato</Label>
                <Input
                  id="emailContato"
                  type="email"
                  value={formData.emailContato}
                  onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="plano">Plano *</Label>
                <Select
                  value={formData.plano}
                  onValueChange={(value: 'basico' | 'profissional' | 'enterprise') =>
                    setFormData({ ...formData, plano: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">BÃ¡sico</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>BÃ¡sico:</strong> Funcionalidades essenciais</p>
                <p><strong>Profissional:</strong> Recursos avanÃ§ados e suporte prioritÃ¡rio</p>
                <p><strong>Enterprise:</strong> Recursos completos e suporte dedicado</p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="primeiroAdminEmail">Email do Admin *</Label>
                <Input
                  id="primeiroAdminEmail"
                  type="email"
                  value={formData.primeiroAdminEmail}
                  onChange={(e) => setFormData({ ...formData, primeiroAdminEmail: e.target.value })}
                  placeholder="admin@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primeiroAdminNome">Nome do Admin *</Label>
                <Input
                  id="primeiroAdminNome"
                  value={formData.primeiroAdminNome}
                  onChange={(e) => setFormData({ ...formData, primeiroAdminNome: e.target.value })}
                  placeholder="Nome Completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primeiroAdminPassword">Senha TemporÃ¡ria *</Label>
                <Input
                  id="primeiroAdminPassword"
                  type="password"
                  value={formData.primeiroAdminPassword}
                  onChange={(e) => setFormData({ ...formData, primeiroAdminPassword: e.target.value })}
                  placeholder="Senha temporÃ¡ria (usuÃ¡rio deve alterar no primeiro acesso)"
                />
              </div>
            </>
          )}

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Anterior
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
              >
                PrÃ³ximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceedToNextStep() || loading}>
                {loading ? 'Criando...' : 'Criar Empresa'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

