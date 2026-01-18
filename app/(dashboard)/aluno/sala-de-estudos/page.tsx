import { requireUser } from '@/lib/auth'
import SalaEstudosClientPage from './sala-estudos-client'

export default async function SalaDeEstudosPage() {
  await requireUser()
  
  return <SalaEstudosClientPage />
}

