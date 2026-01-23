import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function ProfessorPage() {
  const user = await requireUser({ allowedRoles: ['usuario'] })

  if (user.empresaSlug) {
    redirect(`/${user.empresaSlug}/professor/dashboard`)
  }

  // Fallback if no slug (shouldn't happen for valid professors with company)
  return <div>Erro: Professor sem empresa associada. Contate o suporte.</div>
}
