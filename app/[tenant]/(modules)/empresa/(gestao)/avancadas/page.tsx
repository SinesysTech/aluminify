
import { createClient } from "@/app/shared/core/server"
import { redirect } from "next/navigation"
import { ConfiguracoesForm } from "../components/agendamentos/configuracoes-form"
import { getConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"

export default async function ConfiguracoesAvancadasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get professor data to check empresa_id
  const { data: professor } = await supabase
    .from("professores")
    .select("id, empresa_id, is_admin")
    .eq("id", user.id)
    .single()

  if (!professor) {
    redirect("/auth/login")
  }

  const config = await getConfiguracoesProfessor(user.id)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="page-title">Configurações Avançadas</h1>
        <p className="page-subtitle">
          Configure intervalos personalizados, lembretes e preferências de notificações
        </p>
      </div>

      <ConfiguracoesForm professorId={user.id} initialData={config} />
    </div>
  )
}
