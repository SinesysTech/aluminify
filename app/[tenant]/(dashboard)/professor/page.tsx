import { ProfessorTable } from '@/components/admin/professor-table'
import { requireUser } from '@/lib/auth'

export default async function ProfessorPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario'] })

  return <ProfessorTable />
}
