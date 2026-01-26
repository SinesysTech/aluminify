import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Materiais'
}

export default function MateriaisRedirectPage() {
  redirect('/professor/materiais')
}
