import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import FlashcardsClient from './flashcards-client'

export const metadata: Metadata = {
  title: 'Flashcards'
}

export default async function FlashcardsPage() {
  await requireUser()
  
  return <FlashcardsClient />
}
