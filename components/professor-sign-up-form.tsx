'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function ProfessorSignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState<string | null>(null);

  useEffect(() => {
    // Buscar empresa_id via empresa_slug se fornecido
    const empresaSlug = searchParams.get('empresa');
    if (empresaSlug) {
      fetchEmpresaBySlug(empresaSlug);
    }
  }, [searchParams]);

  async function fetchEmpresaBySlug(slug: string) {
    try {
      const response = await fetch(`/api/empresas/lookup?slug=${encodeURIComponent(slug)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Empresa não encontrada ou inativa');
        } else {
          setError('Erro ao buscar empresa');
        }
        return;
      }

      const data = await response.json();
      if (data) {
        setEmpresaId(data.id);
        setEmpresaNome(data.nome);
      }
    } catch (err) {
      console.error('Error fetching empresa:', err);
      setError('Erro ao buscar empresa');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    // Se empresa_slug foi fornecido, validar que empresa foi encontrada
    const empresaSlug = searchParams.get('empresa');
    if (empresaSlug && !empresaId) {
      setError('Empresa não encontrada. Verifique o link de cadastro.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const userMetadata: Record<string, any> = {
        role: 'professor',
        full_name: fullName,
      };

      // Adicionar empresa_id se fornecido
      if (empresaId) {
        userMetadata.empresa_id = empresaId;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este email já está cadastrado');
        }
        throw new Error(signUpError.message);
      }

      if (!data.user) {
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      // Redirecionar para dashboard do professor
      router.push('/tobias');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {empresaNome && (
        <Alert>
          <AlertDescription>
            Cadastrando para: <strong>{empresaNome}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Seu nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu.email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar conta'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/auth/professor/login" className="text-primary hover:underline">
          Faça login
        </Link>
      </div>
    </form>
  );
}
