import { DisciplinaTable } from '@/components/disciplina/disciplina-table'
import { requireUser } from '@/lib/auth'

export default async function DisciplinaPage() {
  await requireUser({ allowedRoles: ['professor'] })
  return <DisciplinaTable />
}