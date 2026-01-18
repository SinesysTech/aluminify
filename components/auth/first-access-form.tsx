'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/client'
import { getDefaultRouteForRole } from '@/lib/roles'
import type { AppUserRole } from '@/types/user'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface FirstAccessFormProps {
  userId: string
  role: AppUserRole
}

export function FirstAccessForm({ userId, role }: FirstAccessFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDev = process.env.NODE_ENV !== 'production'

  const resolveErrorMessage = (err: unknown) => {
    let message: string | null = null
    let errorCode: string | null = null

    // Handle Supabase AuthError
    if (err && typeof err === 'object') {
      // Check for error code first (most reliable)
      if ('code' in err && typeof err.code === 'string') {
        errorCode = err.code
      }
      
      // Get message
      if ('message' in err && typeof err.message === 'string') {
        message = err.message
      } else if ('error_description' in err && typeof err.error_description === 'string') {
        message = err.error_description
      } else if ('hint' in err && typeof err.hint === 'string') {
        message = err.hint
      }
    } else if (typeof err === 'string') {
      message = err
    }

    // Handle specific error codes
    if (errorCode === 'same_password' || message?.toLowerCase().includes('new password should be different')) {
      return 'A nova senha deve ser diferente da sua senha atual. Por favor, escolha uma senha diferente.'
    }

    if (message?.toLowerCase().includes('auth session missing') || message?.toLowerCase().includes('session')) {
      return 'Sua sessão expirou. Faça login novamente para alterar a senha.'
    }

    // Handle permission errors (PostgreSQL error code 42501)
    if (errorCode === '42501' || message?.toLowerCase().includes('permission denied') || message?.toLowerCase().includes('permission') || message?.toLowerCase().includes('policy') || message?.toLowerCase().includes('rls')) {
      return 'Você não tem permissão para atualizar esta informação. Entre em contato com o suporte.'
    }

    if (message?.toLowerCase().includes('password') && message?.toLowerCase().includes('weak')) {
      return 'A senha escolhida é muito fraca. Escolha uma senha mais forte.'
    }

    if (message?.toLowerCase().includes('password') && message?.toLowerCase().includes('length')) {
      return 'A senha deve ter pelo menos 8 caracteres.'
    }

    // Return the message if we have one, otherwise default
    if (message) {
      return message
    }

    return 'Não foi possível atualizar a senha. Tente novamente em instantes.'
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas informadas não conferem.')
      return
    }

    setIsSubmitting(true)

    try {
      // Verify current user session
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[FirstAccessForm] Erro ao obter usuário atual:', userError)
        throw new Error('Sua sessão expirou. Faça login novamente.')
      }

      if (!currentUser) {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }

      if (currentUser.id !== userId) {
        console.warn('[FirstAccessForm] userId não corresponde ao usuário autenticado:', {
          providedUserId: userId,
          currentUserId: currentUser.id,
        })
        // Continue anyway, but use currentUser.id for the update
      }

      const actualUserId = currentUser.id

      // Get session token for authenticated API routes (requireAuth expects Bearer token)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('[FirstAccessForm] Erro ao obter sessão:', sessionError)
        throw new Error('Sua sessão expirou. Faça login novamente.')
      }
      if (!session?.access_token) {
        throw new Error('Sua sessão expirou. Faça login novamente.')
      }

      // Step 1: Update password in Supabase Auth
      console.log('[FirstAccessForm] Atualizando senha no Supabase Auth...')
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      })

      if (updateError) {
        console.error('[FirstAccessForm] Erro ao atualizar senha no Auth:', updateError)
        throw updateError
      }

      console.log('[FirstAccessForm] Senha atualizada no Auth com sucesso')

      // Step 1.5: Finalizar primeiro acesso no servidor (garante flag must_change_password=false)
      // Isso evita loops quando o estado do Auth/DB não está consistente imediatamente.
      const { finalizeFirstAccessAction } = await import('@/app/actions/first-access-actions')
      const finalizeResult = await finalizeFirstAccessAction()
      if (!finalizeResult.success) {
        throw new Error(finalizeResult.error || 'Não foi possível finalizar o primeiro acesso. Tente novamente.')
      }

      // Step 2: Se for aluno, atualizar registro no banco (evita loop de /primeiro-acesso quando a flag vem da tabela alunos)
      if (role === 'aluno') {
        console.log('[FirstAccessForm] Atualizando registro do aluno via API...', { userId: actualUserId })

        const response = await fetch(`/api/student/${actualUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            mustChangePassword: false,
            temporaryPassword: null,
          }),
        })

        if (!response.ok) {
          // Se o aluno não existir no banco, ainda assim podemos prosseguir:
          // o acesso será liberado pelo metadata do Auth (must_change_password=false).
          if (response.status === 404) {
            console.warn('[FirstAccessForm] Aluno não encontrado no banco (404). Prosseguindo com redirect.', {
              userId: actualUserId,
            })
          } else {
            const contentType = response.headers.get('content-type') || ''
            const errorData =
              contentType.includes('application/json')
                ? await response.json().catch(() => ({} as Record<string, unknown>))
                : { error: (await response.text().catch(() => '')).slice(0, 500) }

            console.error('[FirstAccessForm] Erro ao atualizar aluno via API:', errorData)
            const message =
              typeof (errorData as any)?.error === 'string' && (errorData as any).error.trim()
                ? (errorData as any).error
                : 'Erro ao finalizar primeiro acesso. Tente novamente.'
            throw new Error(message)
          }
        } else {
          const result = await response.json().catch(() => null)
          console.log('[FirstAccessForm] Registro do aluno atualizado com sucesso via API:', result?.data)
        }
      }

      router.push(getDefaultRouteForRole(role))
      router.refresh()
    } catch (err) {
      const errorMessage = resolveErrorMessage(err)
      // Evitar poluir o console em erros esperados do Auth (ex.: same_password).
      // Mantemos logs detalhados apenas em desenvolvimento.
      if (isDev) {
        console.error('[FirstAccessForm] Erro ao atualizar senha do primeiro acesso:', err)
        console.log('[FirstAccessForm] Mensagem de erro resolvida:', errorMessage)
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirme a nova senha</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="********"
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar e continuar'}
      </Button>
    </form>
  )
}

