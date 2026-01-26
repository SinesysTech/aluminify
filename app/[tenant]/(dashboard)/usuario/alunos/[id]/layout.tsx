import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalhes do Aluno'
}

export default function AlunoDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
