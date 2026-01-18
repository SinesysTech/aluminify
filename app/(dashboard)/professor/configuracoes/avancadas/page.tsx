import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { ConfiguracoesForm } from "@/components/professor/configuracoes-form"
import { getConfiguracoesProfessor } from "@/app/actions/agendamentos"

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
        <h1 className="text-3xl font-bold">ConfiguraÃ§Ãµes AvanÃ§adas</h1>
        <p className="text-muted-foreground">
          Configure intervalos personalizados, lembretes e preferÃªncias de notificaÃ§Ãµes
        </p>
      </div>

      <ConfiguracoesForm professorId={user.id} initialData={config} />
    </div>
  )
}

