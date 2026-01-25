
import type { Metadata } from 'next'
import { CursoTable } from '../../curso/components/curso-table'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Cursos'
}

export default async function AdminCursosPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

  return <CursoTable />
}
