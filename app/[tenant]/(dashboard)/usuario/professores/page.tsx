import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Professores'
}

export default function ProfessoresRedirectPage() {
  redirect('/superadmin/professores')
}
