import type { Metadata } from 'next'
import { requireUser } from '@/app/shared/core/auth'
import FlashcardsClient from './client'
import FlashcardsAdminClient from './components/flashcards-admin-client'

export const metadata: Metadata = {
  title: 'Flashcards | Aluminify'
}

export default async function FlashcardsPage() {
  const user = await requireUser()

  if (user.role === 'aluno') {
    return <FlashcardsClient />
  }

  // Admins e professores usam a visualização de administração
  return <FlashcardsAdminClient />
}
