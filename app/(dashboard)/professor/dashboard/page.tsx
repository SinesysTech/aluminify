import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function ProfessorDashboardRedirectPage() {
    const user = await requireUser({ allowedRoles: ['usuario'] })

    if (user.empresaSlug) {
        redirect(`/${user.empresaSlug}/professor/dashboard`)
    }

    // Fallback if no slug (shouldn't happen for valid staff with company)
    return <div>Erro: Usuário sem empresa associada. Contate o suporte.</div>
}
