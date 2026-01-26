import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalhes do Curso'
}

export default function CursoDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
