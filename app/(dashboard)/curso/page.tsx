import { CursoTable } from '@/components/curso/curso-table'
import { requireUser } from '@/lib/auth'

export default async function CursoPage() {
  await requireUser({ allowedRoles: ['professor'] })

  return <CursoTable />
}