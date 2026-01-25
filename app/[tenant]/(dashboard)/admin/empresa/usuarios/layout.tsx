import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usuários da Empresa'
}

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
