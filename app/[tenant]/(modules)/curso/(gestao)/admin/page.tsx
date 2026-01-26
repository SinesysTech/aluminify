
import type { Metadata } from 'next'
import { CursoTable } from '../../components/curso-table'
import { requireUser } from '@/app/shared/core/auth'

export const metadata: Metadata = {
  title: 'Cursos'
}

export default async function AdminCursosPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

  return <CursoTable />
}
