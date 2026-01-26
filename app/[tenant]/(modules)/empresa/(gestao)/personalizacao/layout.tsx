import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Personalização da Marca'
}

export default function BrandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
