import { redirect } from 'next/navigation'

import { requireUser } from '@/app/shared/core/auth'
import { getDefaultRouteForRole } from '@/app/shared/core/roles'
import { FirstAccessForm } from '@/app/[tenant]/auth/components/first-access-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PrimeiroAcessoPage() {
  const user = await requireUser({ ignorePasswordRequirement: true })

  if (!user.mustChangePassword) {
    redirect(getDefaultRouteForRole(user.role))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 md:p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Defina sua nova senha</CardTitle>
          <CardDescription>
            Por segurança, você precisa criar uma nova senha antes de acessar sua área.
            <br />
            <strong>Importante:</strong> A nova senha deve ser diferente da senha temporária que você recebeu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FirstAccessForm userId={user.id} role={user.role} />
        </CardContent>
      </Card>
    </div>
  )
}

