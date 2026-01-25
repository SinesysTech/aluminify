import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Flashcards'
}

export default function FlashcardsRedirectPage() {
  redirect('/professor/flashcards')
}
