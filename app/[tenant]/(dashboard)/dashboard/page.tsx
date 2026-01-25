import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/app/shared/core/auth'
import { createClient } from '@/app/shared/core/server'
import { InstitutionDashboardClient } from '@/app/[tenant]/(dashboard)/dashboard/components/institution'
import { ProfessorDashboardClient } from '@/app/[tenant]/(dashboard)/professor/dashboard/components'
import StudentDashboardClientPage from './client'
import { isAdminRoleTipo } from '@/app/shared/core/roles'

export const metadata: Metadata = {
  title: 'Dashboard'
}

export default async function DashboardPage(props: {
  params: Promise<{ tenant: string }>
}) {
  const user = await requireUser()

  if (user.role === 'aluno') {
    return <StudentDashboardClientPage />
  }

  const params = await props.params
  const { tenant } = params

  // Verificar se precisa completar cadastro da empresa
  let shouldRedirectToComplete = false

  if (user.empresaId && user.role !== 'superadmin') {
    try {
      const supabase = await createClient()
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('cnpj, email_contato, telefone')
        .eq('id', user.empresaId)
        .maybeSingle()

      if (!error && empresa) {
        // Verificar se empresa está incompleta (sem CNPJ, email ou telefone)
        // Campos podem ser null ou string vazia
        const cnpjVazio = !empresa.cnpj || empresa.cnpj.trim() === ''
        const emailVazio =
          !empresa.email_contato || empresa.email_contato.trim() === ''
        const telefoneVazio = !empresa.telefone || empresa.telefone.trim() === ''
        shouldRedirectToComplete = cnpjVazio && emailVazio && telefoneVazio
      }
    } catch (error) {
      console.error('Erro ao verificar empresa:', error)
      // Continuar normalmente se houver erro
    }
  }

  if (shouldRedirectToComplete) {
    // Assuming 'empresa' module will be moved to root 'empresa' directory
    redirect(`/${tenant}/empresa/completar`)
  }

  // Se é admin da empresa (ou superadmin), mostrar dashboard da instituição
  // Caso contrário, mostrar dashboard do professor
  const isAdmin = user.role === 'superadmin' || (user.roleType && isAdminRoleTipo(user.roleType))
  if (isAdmin) {
    return <InstitutionDashboardClient />
  }

  return <ProfessorDashboardClient />
}
