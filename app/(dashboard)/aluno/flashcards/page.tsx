import { requireUser } from '@/lib/auth'
import FlashcardsClient from './flashcards-client'

export default async function FlashcardsPage() {
  await requireUser()
  
  return <FlashcardsClient />
}
