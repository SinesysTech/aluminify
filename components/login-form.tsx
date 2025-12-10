'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * @deprecated Este componente está obsoleto e não deve ser usado.
 * Use os novos fluxos separados:
 * - Para alunos: /auth/aluno/login (componente AlunoLoginForm)
 * - Para professores: /auth/professor/login (componente ProfessorLoginForm)
 * - Para cadastro de professores: /auth/professor/cadastro (componente ProfessorSignUpForm)
 * 
 * Este componente redireciona automaticamente para a tela de seleção de tipo de usuário.
 */
export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter()

  // Redirecionar automaticamente para a tela de seleção de tipo de usuário
  useEffect(() => {
    router.push('/auth')
  }, [router])

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Componente Obsoleto</CardTitle>
          <CardDescription>
            Este fluxo de login foi substituído. Redirecionando para a tela de seleção...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Se não for redirecionado automaticamente, clique no botão abaixo:
            </p>
            <Link href="/auth">
              <Button className="w-full">
                Ir para tela de seleção
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
