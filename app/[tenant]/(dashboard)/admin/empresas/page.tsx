import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Empresas'
}

export default function EmpresasRedirectPage() {
  redirect('/superadmin/empresas')
}
