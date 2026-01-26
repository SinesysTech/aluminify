import type { Metadata } from 'next'
import { requireUser } from '@/app/shared/core/auth'
import SalaEstudosClientPage from './client'

export const metadata: Metadata = {
  title: 'Sala de Estudos'
}

export default async function SalaDeEstudosPage() {
  await requireUser()

  return <SalaEstudosClientPage />
}

