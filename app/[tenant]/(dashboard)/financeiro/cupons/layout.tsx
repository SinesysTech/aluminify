import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cupons de Desconto'
}

export default function CuponsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
