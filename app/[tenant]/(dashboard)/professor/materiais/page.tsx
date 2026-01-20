import { requireUser } from '@/lib/auth'
import MateriaisClientPage from './materiais-client'

export default async function MateriaisPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario'] })
  return <MateriaisClientPage />
}

