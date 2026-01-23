import { CursoTable } from '@/components/curso/curso-table'
import { requireUser } from '@/lib/auth'

export default async function AdminCursosPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

  return <CursoTable />
}
