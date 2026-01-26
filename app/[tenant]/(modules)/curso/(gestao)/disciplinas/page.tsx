
import { DisciplinaTable } from './components/curso/disciplinas-table'
import { requireUser } from '@/app/shared/core/auth'

export default async function DisciplinaPage() {
    await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

    return <DisciplinaTable />
}
