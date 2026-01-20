import { requireUser } from '@/lib/auth'
import ConteudosClient from '../../../(dashboard)/conteudos/conteudos-client'

export default async function ConteudosPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario'] })

    return <ConteudosClient />
}
