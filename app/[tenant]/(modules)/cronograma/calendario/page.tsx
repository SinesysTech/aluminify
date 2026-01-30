import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/app/shared/core/server'
import { resolveEmpresaIdFromTenant } from '@/app/shared/core/resolve-empresa-from-tenant'
import { ScheduleCalendarView } from '../components/schedule-calendar-view'

export const metadata: Metadata = {
  title: 'Calendário',
}

export default async function CronogramaCalendarioPage({
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

  const empresaId = await resolveEmpresaIdFromTenant(tenant || '')
  if (!empresaId) redirect(`/${tenant}/dashboard`)

  const { data: cronograma } = await supabase
    .from('cronogramas')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cronograma) {
    redirect(`/${tenant}/cronograma/novo`)
  }

  return <ScheduleCalendarView cronogramaId={cronograma.id} />
}

