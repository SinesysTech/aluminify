import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function DisponibilidadeRedirectPage() {
    const user = await requireUser({ allowedRoles: ['professor'] })

    if (user.empresaSlug) {
        redirect(`/${user.empresaSlug}/professor/disponibilidade`)
    }

    return <div>Erro: Professor sem empresa associada. Contate o suporte.</div>
}
