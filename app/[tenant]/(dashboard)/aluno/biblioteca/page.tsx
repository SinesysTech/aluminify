import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import SalaEstudosClientPage from '../sala-de-estudos/sala-estudos-client'

export const metadata: Metadata = {
  title: 'Biblioteca'
}

export default async function BibliotecaPage() {
  await requireUser()
  return <SalaEstudosClientPage title="Biblioteca" description="Preview da experiência do aluno" />
}

