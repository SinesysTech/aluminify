import { redirect } from 'next/navigation'
import { createClient } from '@/app/shared/core/server'
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

  // Buscar cronograma ativo
  const { data: cronograma } = await supabase
    .from('cronogramas')
    .select('id')
    .eq('aluno_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cronograma) {
    redirect(`/${tenant}/cronograma/novo`)
  }

  return <ScheduleDashboard cronogramaId={cronograma.id} />
}
