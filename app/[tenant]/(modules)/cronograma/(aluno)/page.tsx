import { redirect } from 'next/navigation'
import { createClient } from '@/app/shared/core/server'
import { resolveEmpresaIdFromTenant } from '@/app/shared/core/resolve-empresa-from-tenant'
import { ScheduleDashboard } from '../components/schedule-dashboard'

export default async function CronogramaPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${tenant}/auth/login`)

  const empresaId = await resolveEmpresaIdFromTenant(tenant || '')
  if (!empresaId) redirect(`/${tenant}/dashboard`)

  let query = supabase
    .from('cronogramas')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(1)

  const { data: cronograma } = await query.maybeSingle()

  if (!cronograma) {
    redirect(`/${tenant}/cronograma/novo`)
  }

  return <ScheduleDashboard cronogramaId={cronograma.id} />
}
