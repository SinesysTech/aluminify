import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/app/shared/core/server'
import SalaEstudosClientPage from './client'

export const metadata: Metadata = {
  title: 'Sala de Estudos'
}

export default async function SalaDeEstudosPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${tenant}/auth/login`)

  return <SalaEstudosClientPage />
}

