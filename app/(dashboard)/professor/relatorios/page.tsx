import { RelatoriosDashboard } from "@/components/professor/relatorios-dashboard"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get professor's empresa_id
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id, admin")
    .eq("id", user.id)
    .single()

  if (!professor?.empresa_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">
            Voce precisa estar vinculado a uma empresa para acessar relatorios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatorios de Agendamentos</h1>
        <p className="text-muted-foreground">
          Visualize estatisticas e gere relatorios sobre seus agendamentos.
        </p>
      </div>

      <RelatoriosDashboard empresaId={professor.empresa_id} />
    </div>
  )
}
