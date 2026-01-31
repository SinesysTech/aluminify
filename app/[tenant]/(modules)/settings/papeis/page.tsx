import { requireUser } from '@/app/shared/core/auth'
import { createClient } from '@/app/shared/core/server'
import { redirect } from 'next/navigation'
import { PapeisListClient } from './papeis-list-client'
import { isAdminRoleTipo } from '@/app/shared/core/roles'

export default async function PapeisPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const user = await requireUser()
  const { tenant } = await params

  // Only admins can access this page
  const isAdmin = user.roleType && isAdminRoleTipo(user.roleType)
  if (!isAdmin) {
    redirect(`/${tenant}/dashboard`)
  }

  if (!user.empresaId) {
    redirect(`/${tenant}/dashboard`)
  }

  const supabase = await createClient()

  // Fetch papeis for this empresa (system + custom)
  const { data: papeis, error } = await supabase
    .from('papeis')
    .select('*')
    .or(`empresa_id.is.null,empresa_id.eq.${user.empresaId}`)
    .order('is_system', { ascending: false })
    .order('nome')

  if (error) {
    console.error('Error fetching papeis:', error)
  }

  const formattedPapeis = (papeis ?? []).map((papel) => ({
    id: papel.id,
    empresaId: papel.empresa_id,
    nome: papel.nome,
    tipo: papel.tipo,
    descricao: papel.descricao,
    isSystem: papel.is_system,
    createdAt: papel.created_at,
  }))

  return (
    <div className="container mx-auto py-6">
      <PapeisListClient papeis={formattedPapeis} empresaId={user.empresaId} />
    </div>
  )
}
