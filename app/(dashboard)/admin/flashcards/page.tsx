import { requireUser } from '@/lib/auth'
import FlashcardsAdminClient from './flashcards-admin-client'

export default async function FlashcardsAdminPage() {
  await requireUser({ allowedRoles: ['professor'] })
  return <FlashcardsAdminClient />
}



