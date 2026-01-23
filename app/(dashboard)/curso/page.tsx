import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function CursoRedirectPage() {
  const user = await requireUser({ allowedRoles: ['usuario'] })

  if (user.empresaSlug) {
    redirect(`/${user.empresaSlug}/curso`)
  }

  return <div>Erro: Professor sem empresa associada. Contate o suporte.</div>
}
