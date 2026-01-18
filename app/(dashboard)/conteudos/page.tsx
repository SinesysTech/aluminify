import { requireUser } from '@/lib/auth'
import ConteudosClientPage from './conteudos-client'

export default async function ConteudosPage() {
  await requireUser({ allowedRoles: ['professor'] })
  return <ConteudosClientPage />
}
