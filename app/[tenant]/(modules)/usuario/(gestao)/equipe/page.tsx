import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/shared/core/server'
import { UsuarioRepositoryImpl } from '@/app/[tenant]/(modules)/usuario/services'
import { EquipeClientPage } from './components/client-page'
import { requireUser } from '@/app/shared/core/auth'

export const metadata: Metadata = {
  title: 'Equipe'
}

interface PageProps {
  searchParams: { papelTipo?: string }
}

export default async function EquipePage({ searchParams }: PageProps) {
  const user = await requireUser()

  if (!user.empresaId) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const usuarioRepository = new UsuarioRepositoryImpl(supabase)

  const papelTipoFilter = searchParams.papelTipo || undefined

  const usuarios = await usuarioRepository.listSummaryByEmpresa(user.empresaId, true)

  return (
    <EquipeClientPage
      usuarios={usuarios}
      initialFilter={papelTipoFilter}
    />
  )
}
