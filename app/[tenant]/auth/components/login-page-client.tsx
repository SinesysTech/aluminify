'use client'

import React from 'react'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { AuthPageLayout } from './auth-page-layout'
import { AuthDivider } from './auth-divider'
import { LoginDecorativeCard } from './login-decorative-card'
import { MagicLinkButton } from './magic-link-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/app/shared/components/forms/checkbox'
import { Input } from '@/app/shared/components/forms/input'
import { Label } from '@/app/shared/components/forms/label'
import { createClient } from '@/app/shared/core/client'
import { toast } from 'sonner'

function safeNextPath(next: string | null | undefined) {
  if (!next) return null
  return next.startsWith('/') ? next : null
}

export function LoginPageClient() {
  const params = useParams();
  const tenant = params?.tenant as string
  const searchParams = useSearchParams()

  const next = useMemo(() => {
    return safeNextPath(searchParams?.get('next')) ?? '/protected'
  }, [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMagicLink = async () => {
    if (isLoading) return
    if (!email) {
      toast.error('Email obrigatório', {
        description: 'Informe seu email para receber o magic link.',
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo },
      })

      if (error) {
        toast.error('Não foi possível enviar o link', {
          description: error.message,
        })
        return
      }

      toast.success('Magic link enviado', {
        description: 'Verifique sua caixa de entrada para continuar o login.',
      })
    } catch (error) {
      console.error('[login] Erro ao enviar magic link:', error)
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[DEBUG] handleSubmit iniciado', { email, hasPassword: !!password, passwordLength: password.length })

    if (isLoading) {
      console.log('[DEBUG] handleSubmit cancelado: já está carregando')
      return
    }

    if (!email || !password) {
      console.log('[DEBUG] handleSubmit cancelado: campos vazios', { hasEmail: !!email, hasPassword: !!password })
      toast.error('Campos obrigatórios', {
        description: 'Informe email e senha para entrar.',
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('[DEBUG] Criando cliente Supabase...')
      const supabase = createClient()
      console.log('[DEBUG] Cliente Supabase criado, chamando signInWithPassword...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      console.log('[DEBUG] Resultado signInWithPassword:', {
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status,
        hasSession: !!data?.session,
        hasUser: !!data?.user
      })

      if (error) {
        // Tratamento de erros específicos do Supabase
        let errorDescription = error.message

        if (error.message.includes('Invalid login credentials')) {
          errorDescription = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        } else if (error.message.includes('Email not confirmed')) {
          errorDescription = 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.'
        } else if (error.message.includes('Too many requests')) {
          errorDescription = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
        }

        toast.error('Não foi possível entrar', {
          description: errorDescription,
        })
        return
      }

      console.log('[DEBUG] Login bem-sucedido')

      // Garantia: se este navegador ficou com cookie de impersonação (httpOnly) de uma sessão anterior,
      // ao logar novamente o usuário deve voltar para o próprio contexto.
      // Fazemos best-effort aqui: se não existir cookie, a API pode retornar 400/401 e tudo bem.
      try {
        const token = data.session?.access_token
        if (token) {
          // Chamada silenciosa: não logamos erro se falhar, pois é um cleanup preventivo
          // para garantir que o usuário não herde cookies de impersonação de sessões anteriores
          await fetch('/api/auth/stop-impersonate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => null)
        }
      } catch {
        // noop
      }

      // Identify user role to determine redirect URL
      const { identifyUserRoleAction } = await import('@/app/shared/core/actions/auth-actions')
      const roleResult = await identifyUserRoleAction(data.user.id)

      let targetUrl = next
      if (roleResult.success && roleResult.redirectUrl) {
        // Determine if we should use the role-based redirect
        // If "next" is the default "/protected" or not present in search params, use identified role url
        const hasExplicitNext = searchParams?.get('next')
        if (!hasExplicitNext || next === '/protected') {
          targetUrl = roleResult.redirectUrl
        }
      }

      console.log('[DEBUG] Redirecionando para:', targetUrl)
      window.location.href = targetUrl
    } catch (error) {
      console.error('[DEBUG] Erro inesperado no login:', error)
      console.error('[DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A')
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      })
    } finally {
      console.log('[DEBUG] handleSubmit finalizado, setIsLoading(false)')
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
        <p></p>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Informe seus dados para acessar o sistema</p>
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
              onChange={(e) => {
                const newValue = e.target.value
                console.log('[DEBUG] Senha alterada, novo comprimento:', newValue.length)
                setPassword(newValue)
              }}
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

            <Link href={tenant ? `/${tenant}/auth/forgot-password` : "/auth/forgot-password"} className="text-sm text-primary hover:underline">
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
      </div>
    </AuthPageLayout>
  )
}

