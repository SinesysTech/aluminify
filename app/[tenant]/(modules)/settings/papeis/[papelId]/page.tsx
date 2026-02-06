import { requireUser } from '@/app/shared/core/auth'
import { createClient } from '@/app/shared/core/server'
import { redirect, notFound } from 'next/navigation'
import { EditPapelClient } from './edit-papel-client'
import type { RolePermissions, RoleTipo } from '@/app/shared/types/entities/papel'

interface PageProps {
  params: Promise<{ papelId: string; tenant: string }>
}

export default async function EditPapelPage({ params }: PageProps) {
  const { papelId, tenant } = await params
  const user = await requireUser()

  // Only admins can access this page
  if (!user.isAdmin) {
    redirect(`/${tenant}/dashboard`)
  }

  if (!user.empresaId) {
    redirect(`/${tenant}/dashboard`)
  }

  const supabase = await createClient()

  // Fetch the papel
  const { data: papel, error } = await supabase
    .from('papeis')
    .select('*')
    .eq('id', papelId)
    .or(`empresa_id.is.null,empresa_id.eq.${user.empresaId}`)
    .single()

  if (error || !papel) {
    notFound()
  }

  const formattedPapel = {
    id: papel.id,
    empresaId: papel.empresa_id,
    nome: papel.nome,
    tipo: papel.tipo as RoleTipo,
    descricao: papel.descricao,
    permissoes: papel.permissoes as unknown as RolePermissions,
    isSystem: papel.is_system,
    createdAt: new Date(papel.created_at),
    updatedAt: new Date(papel.updated_at),
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <EditPapelClient papel={formattedPapel} empresaId={user.empresaId} />
    </div>
  )
}
