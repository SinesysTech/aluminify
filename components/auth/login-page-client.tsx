'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { AuthRoleSwitch } from '@/components/auth/auth-role-switch'
import { AuthDivider } from '@/components/auth/auth-divider'
import { LoginDecorativeCard } from '@/components/auth/login-decorative-card'
import { MagicLinkButton } from '@/components/auth/magic-link-button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/client'

export type LoginPageVariant = 'generic' | 'aluno' | 'professor'

function safeNextPath(next: string | null | undefined) {
  if (!next) return null
  return next.startsWith('/') ? next : null
}

function getCopy(variant: LoginPageVariant) {
  if (variant === 'professor') {
    return {
      title: 'Entrar como professor(a)',
      subtitle: 'Acesse o painel da sua empresa e gerencie sua instituição.',
      emailLabel: 'Email corporativo',
      footer: (
        <p>
          Vai entrar como aluno?{' '}
          <Link href="/auth/aluno/login" className="font-medium text-primary hover:underline">
            Acessar área do aluno
          </Link>
        </p>
      ),
    }
  }

  if (variant === 'aluno') {
    return {
      title: 'Entrar como aluno',
      subtitle: 'Acesse sua área de estudos e acompanhe seu progresso.',
      emailLabel: 'Email',
      footer: (
        <p>
          Vai entrar como professor(a)?{' '}
          <Link href="/auth/professor/login" className="font-medium text-primary hover:underline">
            Acessar painel do professor
          </Link>
        </p>
      ),
    }
  }

  return {
    title: 'Bem-vindo de volta',
    subtitle: 'Escolha como deseja entrar e informe seus dados.',
    emailLabel: 'Email',
    footer: (
      <p>
        Não tem uma conta?{' '}
        <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
          Criar infraestrutura
        </Link>
      </p>
    ),
  }
}

export function LoginPageClient({ variant = 'generic' }: { variant?: LoginPageVariant }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const next = useMemo(() => {
    return safeNextPath(searchParams?.get('next')) ?? '/protected'
  }, [searchParams])

  const copy = useMemo(() => getCopy(variant), [variant])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMagicLink = async () => {
    if (isLoading) return
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Informe seu email para receber o magic link.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo },
      })

      if (error) {
        toast({
          title: 'Não foi possível enviar o link',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Magic link enviado',
        description: 'Verifique sua caixa de entrada para continuar o login.',
      })
    } catch (error) {
      console.error('[login] Erro ao enviar magic link:', error)
      toast({
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe email e senha para entrar.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        toast({
          title: 'Não foi possível entrar',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      // TODO: respeitar rememberDevice (hoje o client usa persistência padrão)
      router.push(next)
      router.refresh()
    } catch (error) {
      console.error('[login] Erro ao fazer login:', error)
      toast({
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageLayout
      formSide="left"
      formWidth="480px"
      decorativeBackground="light"
      decorativeContent={<LoginDecorativeCard />}
      footerContent={copy.footer}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl font-bold text-gray-900">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <AuthRoleSwitch />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{copy.emailLabel}</Label>
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
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="space-y-4">
          <AuthDivider text="OU CONTINUE COM" />
          <OAuthButtons disabled={isLoading} />
        </div>
      </div>
    </AuthPageLayout>
  )
}

