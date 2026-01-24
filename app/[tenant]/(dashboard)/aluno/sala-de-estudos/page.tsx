import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import SalaEstudosClientPage from './sala-estudos-client'

export const metadata: Metadata = {
  title: 'Sala de Estudos'
}

export default async function SalaDeEstudosPage() {
  await requireUser()
  
  return <SalaEstudosClientPage />
}

