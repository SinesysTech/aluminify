'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function AlunoLoginForm() {
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

      // Validar se o usuário é realmente um aluno
      const userRole = authData.user.user_metadata?.role;
      if (userRole !== 'aluno') {
        await supabase.auth.signOut();
        throw new Error('Esta área é exclusiva para alunos. Professores devem usar a área de login adequada.');
      }

      // Verificar se precisa alterar senha no primeiro acesso
      // Primeiro verifica o user_metadata, depois consulta a tabela alunos para garantir consistência
      let mustChangePassword = Boolean(authData.user.user_metadata?.must_change_password);
      
      // Consultar a tabela alunos para obter o valor mais atualizado
      const { data: alunoData } = await supabase
        .from('alunos')
        .select('must_change_password')
        .eq('id', authData.user.id)
        .maybeSingle();

      // Se o valor existe na tabela alunos, usar esse (fonte de verdade)
      if (alunoData?.must_change_password !== undefined) {
        mustChangePassword = alunoData.must_change_password;
      }

      if (mustChangePassword) {
        router.push('/primeiro-acesso');
        return;
      }

      // Redirecionar para dashboard do aluno
      router.push('/aluno/dashboard');
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
    </form>
  );
}
