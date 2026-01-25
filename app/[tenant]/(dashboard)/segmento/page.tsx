
import { SegmentoTable } from './components/segmento-table'
import { requireUser } from '@/app/shared/core/auth'

export default async function SegmentoPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <SegmentoTable />
}
