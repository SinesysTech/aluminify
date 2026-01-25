import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
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

  return <FlashcardsAdminClient />
}
