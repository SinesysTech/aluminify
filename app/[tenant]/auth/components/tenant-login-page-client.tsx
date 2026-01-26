'use client'

import React from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { AuthPageLayout } from './auth-page-layout';
import { AuthDivider } from './auth-divider';
import { LoginDecorativeCard } from './login-decorative-card';
import { MagicLinkButton } from './magic-link-button';
import { OAuthButtons } from './oauth-buttons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/app/shared/components/forms/checkbox';
import { Input } from '@/app/shared/components/forms/input';
import { Label } from '@/app/shared/components/forms/label';
import { createClient } from '@/app/shared/core/client';
import { toast } from 'sonner';

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

  const next = useMemo(() => {
    return safeNextPath(searchParams?.get('next')) ?? '/protected';
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  // Load branding for this tenant (unauthenticated)
  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await fetch(`/api/empresa/personalizacao/${empresaId}/public`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const branding = result.data;

            // Set Logo
            if (branding.logos?.login?.logoUrl) {
              setBrandingLogo(branding.logos.login.logoUrl);
            }

            // Apply Colors
            if (branding.colorPalette) {
              const root = document.documentElement;
              const p = branding.colorPalette;

              root.style.setProperty('--primary', p.primaryColor);
              root.style.setProperty('--primary-foreground', p.primaryForeground);
              root.style.setProperty('--secondary', p.secondaryColor);
              root.style.setProperty('--secondary-foreground', p.secondaryForeground);
              root.style.setProperty('--accent', p.accentColor);
              root.style.setProperty('--accent-foreground', p.accentForeground);
              root.style.setProperty('--muted', p.mutedColor);
              root.style.setProperty('--muted-foreground', p.mutedForeground);
              root.style.setProperty('--background', p.backgroundColor);
              root.style.setProperty('--foreground', p.foregroundColor);
              root.style.setProperty('--card', p.cardColor);
              root.style.setProperty('--card-foreground', p.cardForeground);
              root.style.setProperty('--destructive', p.destructiveColor);
              root.style.setProperty('--destructive-foreground', p.destructiveForeground);
              root.style.setProperty('--sidebar-background', p.sidebarBackground);
              root.style.setProperty('--sidebar-foreground', p.sidebarForeground);
              root.style.setProperty('--sidebar-primary', p.sidebarPrimary);
              root.style.setProperty('--sidebar-primary-foreground', p.sidebarPrimaryForeground);
            }

            // Apply Fonts
            if (branding.fontScheme) {
              const root = document.documentElement;
              const f = branding.fontScheme;

              if (f.fontSans && f.fontSans.length > 0) {
                root.style.setProperty('--font-sans', f.fontSans.join(', '));
              }
              if (f.fontMono && f.fontMono.length > 0) {
                root.style.setProperty('--font-mono', f.fontMono.join(', '));
              }

              // Load Google Fonts
              if (f.googleFonts && f.googleFonts.length > 0) {
                f.googleFonts.forEach((fontFamily: string) => {
                  const link = document.createElement('link');
                  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
                  link.rel = 'stylesheet';
                  link.crossOrigin = 'anonymous';
                  document.head.appendChild(link);
                });
              }
            }

            // Apply Custom CSS
            if (branding.tenantBranding?.customCss) {
              const styleId = 'tenant-custom-css';
              let styleElement = document.getElementById(styleId) as HTMLStyleElement;
              if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
              }
              styleElement.textContent = branding.tenantBranding.customCss;
            }
          }
        }
      } catch (error) {
        console.warn('[tenant-login] Failed to load branding:', error);
      } finally {
        setLoadingLogo(false);
      }
    }
    loadBranding();
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
      toast.error('Email obrigatório', {
        description: 'Informe seu email para receber o magic link.',
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
        toast.error('Não foi possível enviar o link', {
          description: error.message,
        });
        return;
      }

      toast.success('Magic link enviado', {
        description: 'Verifique sua caixa de entrada para continuar o login.',
      });
    } catch (error) {
      console.error('[tenant-login] Erro ao enviar magic link:', error);
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
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
      toast.error('Campos obrigatórios', {
        description: 'Informe email e senha para entrar.',
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
        let errorDescription = error.message;

        if (error.message.includes('Invalid login credentials')) {
          errorDescription = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
          errorDescription = 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorDescription = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
        }

        toast.error('Não foi possível entrar', {
          description: errorDescription,
        });
        return;
      }

      // Garantia: se este navegador ficou com cookie de impersonação (httpOnly) de uma sessão anterior,
      // ao logar novamente o usuário deve voltar para o próprio contexto.
      // Best-effort: se não existir cookie, a API pode retornar 400/401 e tudo bem.
      try {
        const token = data.session?.access_token;
        if (token) {
          await fetch('/api/auth/stop-impersonate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => null);
        }
      } catch {
        // noop
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

        toast.error('Acesso negado', {
          description: validateResult.message || 'Você não tem acesso a esta instituição.',
        });
        return;
      }

      // Identify user roles for this tenant
      console.log('[DEBUG] Identificando roles do usuário...');
      // Use Server Action instead of broken API route
      const { identifyUserRoleAction } = await import('@/app/shared/core/actions/auth-actions');
      const roleResult = await identifyUserRoleAction(data.user.id);

      if (roleResult.success) {
        console.log('[DEBUG] Role identificado, URL de destino:', roleResult.redirectUrl);
      }

      console.log('[DEBUG] Login bem-sucedido, redirecionando para:', next);

      // If we have a role-based redirect, prefer it over the default /protected
      // unless the user specifically requested a URL (next != /protected)
      let finalNext = next;
      if (roleResult.success && roleResult.redirectUrl) {
        const hasExplicitNext = searchParams?.get('next');
        if (!hasExplicitNext || next === '/protected') {
          finalNext = roleResult.redirectUrl;
        }
      }

      router.push(finalNext);
      router.refresh();
    } catch (error) {
      console.error('[DEBUG] Erro inesperado no login:', error);
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
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

            <Link href={`/${tenantSlug}/auth/forgot-password`} className="text-sm text-primary hover:underline">
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
