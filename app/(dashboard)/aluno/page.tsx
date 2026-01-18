import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function AlunoRedirectPage() {
  const user = await requireUser({ allowedRoles: ['professor', 'superadmin'] })

  if (user.empresaSlug) {
    redirect(`/${user.empresaSlug}/aluno`)
  }

  return <div>Erro: Usuário sem empresa associada. Contate o suporte.</div>
}
