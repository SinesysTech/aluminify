import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getConfiguracoesProfessor } from "@/app/actions/agendamentos"
import { ConfiguracoesForm } from "@/components/professor/configuracoes-form"

export default async function ProfessorConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/professor/login")
  }

  const configuracoes = await getConfiguracoesProfessor(user.id)

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes de Agendamento</h1>
        <p className="text-muted-foreground">
          Configure suas preferencias para agendamentos de mentoria.
        </p>
      </div>

      <ConfiguracoesForm
        professorId={user.id}
        initialData={configuracoes}
      />
    </div>
  )
}
