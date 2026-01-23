import { SegmentoTable } from '@/components/segmento/segmento-table'
import { requireUser } from '@/lib/auth'

export default async function SegmentoPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <SegmentoTable />
}
