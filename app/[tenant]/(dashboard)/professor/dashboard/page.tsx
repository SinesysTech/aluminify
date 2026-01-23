import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/server'
import { InstitutionDashboardClient } from '@/components/dashboard/institution'
import { ProfessorDashboardClient } from '@/components/dashboard/professor'
import { isAdminRoleTipo } from '@/lib/roles'

export default async function ProfessorDashboardPage(props: {
  params: Promise<{ tenant: string }>
}) {
  const params = await props.params
  const { tenant } = params
  const user = await requireUser()

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
    redirect(`/${tenant}/professor/empresa/completar`)
  }

  // Se é admin da empresa (ou superadmin), mostrar dashboard da instituição
  // Caso contrário, mostrar dashboard do professor
  const isAdmin = user.role === 'superadmin' || (user.roleType && isAdminRoleTipo(user.roleType))
  if (isAdmin) {
    return <InstitutionDashboardClient />
  }

  return <ProfessorDashboardClient />
}

