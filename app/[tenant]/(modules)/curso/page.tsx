
import { CursoTable } from './components/curso-table'
import { requireUser } from '@/app/shared/core/auth'

export default async function CursoPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <CursoTable />
}
