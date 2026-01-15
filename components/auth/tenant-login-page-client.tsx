'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { AuthPageLayout } from '@/components/auth/auth-page-layout';
import { AuthDivider } from '@/components/auth/auth-divider';
import { LoginDecorativeCard } from '@/components/auth/login-decorative-card';
import { MagicLinkButton } from '@/components/auth/magic-link-button';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/client';

interface TenantLoginPageClientProps {
  tenantSlug: string;
  empresaId: string;
  empresaNome: string;
  logoUrl?: string | null;
}

function safeNextPath(next: string | null | undefined) {
  if (!next) return null;
  return next.startsWith('/') ? next : null;
}

export function TenantLoginPageClient({
  tenantSlug,
  empresaId,
  empresaNome,
  logoUrl,
}: TenantLoginPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const next = useMemo(() => {
    return safeNextPath(searchParams?.get('next')) ?? '/protected';
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  // Load branding logo for this tenant (unauthenticated)
  useEffect(() => {
    async function loadBrandingLogo() {
      try {
        const response = await fetch(`/api/tenant-branding/${empresaId}/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.logos?.login?.logoUrl) {
            setBrandingLogo(data.logos.login.logoUrl);
          }
        }
      } catch (error) {
        console.warn('[tenant-login] Failed to load branding logo:', error);
      } finally {
        setLoadingLogo(false);
      }
    }
    loadBrandingLogo();
  }, [empresaId]);

  // Determine which logo to use
  const displayLogo = useMemo(() => {
    // Prefer custom branding logo, fall back to empresa logo_url
    if (brandingLogo) {
      return brandingLogo;
    }
    return logoUrl;
  }, [brandingLogo, logoUrl]);

  const handleMagicLink = async () => {
    if (isLoading) return;
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Informe seu email para receber o magic link.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo },
      });

      if (error) {
        toast({
          title: 'Não foi possível enviar o link',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Magic link enviado',
        description: 'Verifique sua caixa de entrada para continuar o login.',
      });
    } catch (error) {
      console.error('[tenant-login] Erro ao enviar magic link:', error);
      toast({
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleSubmit iniciado', { email, hasPassword: !!password, tenantSlug, empresaId });

    if (isLoading) {
      console.log('[DEBUG] handleSubmit cancelado: já está carregando');
      return;
    }

    if (!email || !password) {
      console.log('[DEBUG] handleSubmit cancelado: campos vazios');
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe email e senha para entrar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('[DEBUG] Criando cliente Supabase...');
      const supabase = createClient();
      console.log('[DEBUG] Cliente Supabase criado, chamando signInWithPassword...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log('[DEBUG] Resultado signInWithPassword:', {
        hasError: !!error,
        errorMessage: error?.message,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
      });

      if (error) {
        const errorTitle = 'Não foi possível entrar';
        let errorDescription = error.message;

        if (error.message.includes('Invalid login credentials')) {
          errorDescription = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
          errorDescription = 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorDescription = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });
        return;
      }

      // Validate user belongs to this tenant
      console.log('[DEBUG] Validando pertencimento ao tenant...');
      const validateResponse = await fetch('/api/auth/validate-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId }),
      });

      if (!validateResponse.ok) {
        const validateResult = await validateResponse.json();
        console.log('[DEBUG] Validação de tenant falhou:', validateResult);

        // Logout user since they don't belong to this tenant
        await supabase.auth.signOut();

        toast({
          title: 'Acesso negado',
          description: validateResult.message || 'Você não tem acesso a esta instituição.',
          variant: 'destructive',
        });
        return;
      }

      // Identify user roles for this tenant
      console.log('[DEBUG] Identificando roles do usuário...');
      const roleResponse = await fetch('/api/user/identify-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId }),
      });

      if (roleResponse.ok) {
        const roleResult = await roleResponse.json();
        console.log('[DEBUG] Roles identificados:', roleResult);
      }

      console.log('[DEBUG] Login bem-sucedido, redirecionando para:', next);
      router.push(next);
      router.refresh();
    } catch (error) {
      console.error('[DEBUG] Erro inesperado no login:', error);
      toast({
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      console.log('[DEBUG] handleSubmit finalizado');
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      formSide="left"
      formWidth="480px"
      decorativeBackground="light"
      decorativeContent={<LoginDecorativeCard />}
      footerContent={
        <p>
          Não tem uma conta?{' '}
          <Link href={`/${tenantSlug}/auth/sign-up`} className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {displayLogo && !loadingLogo && (
            <div className="relative h-16 w-48">
              <Image
                src={displayLogo}
                alt={`Logo ${empresaNome}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          <div className="text-center">
            <h1 className="font-sans text-3xl font-bold text-gray-900">
              Bem-vindo à {empresaNome}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe seus dados para acessar o sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <MagicLinkButton onClick={handleMagicLink} loading={isLoading} disabled={!email} />

          <AuthDivider />

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                Lembrar dispositivo
              </Label>
            </div>

            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isLoading || !password}
            title={!password ? 'Digite sua senha para habilitar o botão' : undefined}
          >
            {isLoading ? 'Entrando...' : !password ? 'Digite a senha para entrar' : 'Entrar'}
          </Button>
        </form>

        <div className="space-y-4">
          <AuthDivider text="OU CONTINUE COM" />
          <OAuthButtons disabled={isLoading} />
        </div>
      </div>
    </AuthPageLayout>
  );
}
