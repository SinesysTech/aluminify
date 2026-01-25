
import { DisciplinaTable } from './components/disciplina-table'
import { requireUser } from '@/lib/auth'

export default async function DisciplinaPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <DisciplinaTable />
}
