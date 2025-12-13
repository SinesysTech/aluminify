'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { isProfessorRole, getDefaultRouteForRole } from '@/lib/roles';
import Link from 'next/link';

export function ProfessorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Realizar login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Email ou senha inválidos. Verifique suas credenciais.');
      }

      if (!authData.user) {
        throw new Error('Erro ao fazer login. Tente novamente.');
      }

      // Validar se o usuário é realmente um professor
      const userRole = authData.user.user_metadata?.role;
      if (!isProfessorRole(userRole)) {
        await supabase.auth.signOut();
        throw new Error('Esta área é exclusiva para professores. Alunos devem usar a área de login adequada.');
      }

      // Redirecionar para dashboard
      const defaultRoute = getDefaultRouteForRole(userRole);
      router.push(defaultRoute);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <a
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Esqueceu a senha?
          </a>
        </div>
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/auth/professor/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </div>
    </form>
  );
}
