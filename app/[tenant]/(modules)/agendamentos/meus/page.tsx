import type { Metadata } from 'next'
import { createClient } from "@/app/shared/core/server"
import { resolveEmpresaIdFromTenant } from '@/app/shared/core/resolve-empresa-from-tenant'
import { redirect } from "next/navigation"
import { getAgendamentosAluno } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { MeusAgendamentosList } from "../components/meus-agendamentos-list"
import { ProfessorAgendamentosView } from "../components/agendamentos-professor-view"

export const metadata: Metadata = {
  title: 'Meus Agendamentos'
}

interface MeusAgendamentosPageProps {
  params: Promise<{ tenant: string }>
}

export default async function MeusAgendamentosPage({ params }: MeusAgendamentosPageProps) {
  const { tenant } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${tenant}/auth`)
  }

  // Check if user is an institution member (has empresa_id)
  const { data: userData } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("id", user.id)
    .single()

  const isInstitutionUser = !!userData?.empresa_id

  if (isInstitutionUser) {
    return <ProfessorAgendamentosView userId={user.id} />
  }

  // If student (no empresa_id or explicitly student context), show student view
  const empresaId = await resolveEmpresaIdFromTenant(tenant || '')
  const agendamentos = await getAgendamentosAluno(user.id, empresaId)

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Meus Agendamentos</h1>
          <p className="page-subtitle">
            Visualize e gerencie suas sessões de mentoria agendadas.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${tenant}/agendamentos`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      <MeusAgendamentosList agendamentos={agendamentos} />
    </div>
  )
}