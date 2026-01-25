
import { DisciplinaTable } from './components/disciplina-table'
import { requireUser } from '@/app/shared/core/auth'

export default async function DisciplinaPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <DisciplinaTable />
}
