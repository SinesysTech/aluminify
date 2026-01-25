import { ProfessorTable } from '../admin/professores/components/professor-table'
import { requireUser } from '@/app/shared/core/auth'

export default async function ProfessorPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario'] })

  return <ProfessorTable />
}
