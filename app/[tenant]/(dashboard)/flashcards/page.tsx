import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FlashcardsClient from './client'

export const metadata: Metadata = {
  title: 'Flashcards | Aluminify'
}

export default async function FlashcardsPage() {
  const user = await requireUser()

  if (user.role === 'aluno') {
    return <FlashcardsClient />
  }

  // Admins e professores devem usar o módulo de administração
  redirect('/admin/flashcards')
}
