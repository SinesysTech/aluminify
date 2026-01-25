import type { Metadata } from 'next'
import { requireUser } from '@/app/shared/core/auth'
import BibliotecaClient from './client'

export const metadata: Metadata = {
  title: 'Biblioteca'
}

export default async function BibliotecaPage() {
  await requireUser()
  return <BibliotecaClient />
}
