
import { createClient } from "@/app/shared/core/server"
import { redirect } from "next/navigation"
import { getConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { ConfiguracoesForm } from "./components/configuracoes-form"

export default async function ProfessorConfiguracoesPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${tenant}/auth/login`)
  }

  const configuracoes = await getConfiguracoesProfessor(user.id)

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Configurações de Agendamento</h1>
        <p className="page-subtitle">
          Configure suas preferências para agendamentos de mentoria.
        </p>
      </div>

      <ConfiguracoesForm
        professorId={user.id}
        initialData={configuracoes}
      />
    </div>
  )
}
