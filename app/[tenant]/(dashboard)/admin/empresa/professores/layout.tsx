import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Professores da Empresa'
}

export default function ProfessoresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
