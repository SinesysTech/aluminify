import type { Metadata } from 'next'
import MateriaisClientPage from './materiais-client'

export const metadata: Metadata = {
  title: 'Materiais'
}

export default function MateriaisPage() {
  return <MateriaisClientPage />
}
