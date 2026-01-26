import { requireUser } from '@/app/shared/core/auth'
import FlashcardsAdminClient from './flashcards-admin-client'

export default async function FlashcardsAdminPage() {
  await requireUser({ allowedRoles: ['professor', 'usuario'] })
  return <FlashcardsAdminClient />
}

