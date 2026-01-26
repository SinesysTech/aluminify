import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalhes do Usuário'
}

export default function UsuarioDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
