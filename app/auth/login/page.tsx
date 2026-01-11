'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { LoginDecorativeCard } from '@/components/auth/login-decorative-card'
import { MagicLinkButton } from '@/components/auth/magic-link-button'
import { AuthDivider } from '@/components/auth/auth-divider'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/client'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

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

      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=/protected`
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
        },
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
        description:
          error instanceof Error ? error.message : 'Tente novamente em instantes.',
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
      router.push('/protected')
      router.refresh()
    } catch (error) {
      console.error('[login] Erro ao fazer login:', error)
      toast({
        title: 'Erro inesperado',
        description:
          error instanceof Error ? error.message : 'Tente novamente em instantes.',
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
      footerContent={
        <p>
          Não tem uma conta?{' '}
          <Link
            href="/auth/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Criar infraestrutura
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse o painel de controle da sua instituição
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Corporativo</Label>
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

          {/* Magic Link */}
          <MagicLinkButton
            onClick={handleMagicLink}
            loading={isLoading}
            disabled={!email}
          />

          <AuthDivider />

          {/* Password */}
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

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal text-muted-foreground"
              >
                Lembrar dispositivo
              </Label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isLoading || !password}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* OAuth */}
        <div className="space-y-4">
          <AuthDivider text="OU CONTINUE COM" />
          <OAuthButtons disabled={isLoading} />
        </div>
      </div>
    </AuthPageLayout>
  )
}
