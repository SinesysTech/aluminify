'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { AppUserRole } from '@/types/user'
import { getDefaultRouteForRole, isProfessorRole } from '@/lib/roles'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [roleSelection, setRoleSelection] = useState<'aluno' | 'professor'>('aluno')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw userError || new Error('Não foi possível carregar os dados do usuário')
      }

      const role = (user.user_metadata?.role as AppUserRole) || 'aluno'
      const matchesSelection =
        (roleSelection === 'aluno' && role === 'aluno') ||
        (roleSelection === 'professor' && isProfessorRole(role))

      if (!matchesSelection) {
        await supabase.auth.signOut()
        setError(
          role === 'aluno'
            ? 'Este login está vinculado a um perfil de estudante. Escolha "Estudante" para acessar.'
            : 'Este login está vinculado a um perfil de professor. Escolha "Professor" para acessar.'
        )
        return
      }

      // Ensure professor record exists immediately after login
      // This is best-effort - the handle_new_user trigger should have created it
      if (isProfessorRole(role)) {
        try {
          // Silently check and create if needed - errors are expected if RLS policy isn't set
          const { data: existingProfessor } = await supabase
            .from('professores')
            .select('id, email')
            .eq('id', user.id)
            .maybeSingle()

          if (!existingProfessor) {
            // Try to create, but don't fail if it doesn't work
            // The record should have been created by handle_new_user trigger
            await supabase
              .from('professores')
              .insert({
                id: user.id,
                email: user.email || '',
                nome_completo: user.user_metadata?.full_name || 
                              user.user_metadata?.name || 
                              user.email?.split('@')[0] || 
                              'Novo Professor'
              })
            // Ignore errors - they're expected if RLS policy isn't set up yet
          }
        } catch (error) {
          // Silently ignore - non-critical operation
          // The record should already exist from the trigger
        }
      }

      if (user.user_metadata?.must_change_password) {
        router.push('/primeiro-acesso')
        return
      }

      router.push(getDefaultRouteForRole(role))
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
          <CardDescription>Escolha o tipo de acesso e informe suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Selecione o tipo de acesso</Label>
                <RadioGroup
                  className="grid gap-3 md:grid-cols-2"
                  value={roleSelection}
                  onValueChange={(value) => setRoleSelection(value as 'aluno' | 'professor')}
                >
                  <Label
                    htmlFor="role-aluno"
                    className={cn(
                      'border-input hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm',
                      roleSelection === 'aluno' && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem id="role-aluno" value="aluno" />
                    Estudante
                  </Label>
                  <Label
                    htmlFor="role-professor"
                    className={cn(
                      'border-input hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm',
                      roleSelection === 'professor' && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem id="role-professor" value="professor" />
                    Professor(a)
                  </Label>
                </RadioGroup>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Ainda não possui uma conta?{' '}
              <Link href="/auth/professor/cadastro" className="underline underline-offset-4">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
