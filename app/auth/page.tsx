import Link from 'next/link'

import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { LoginDecorativeCard } from '@/components/auth/login-decorative-card'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  return (
    <AuthPageLayout
      formSide="left"
      formWidth="480px"
      decorativeBackground="light"
      decorativeContent={<LoginDecorativeCard />}
      footerContent={
        <p>
          Já sabe qual rota quer usar?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Ir para login genérico
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Como você quer entrar?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione o tipo de acesso para ir à tela de login correspondente.
          </p>
        </div>

        <div className="grid gap-3">
          <Button asChild size="lg">
            <Link href="/auth/professor/login">Entrar como professor(a) (empresa)</Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/auth/aluno/login">Entrar como aluno</Link>
          </Button>
        </div>
      </div>
    </AuthPageLayout>
  )
}
