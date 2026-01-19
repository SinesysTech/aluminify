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
    .select("empresa_id, is_admin")
    .eq("id", user.id)
    .single()

  if (!professor?.empresa_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para acessar relatórios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Relatórios de Agendamentos</h1>
        <p className="page-subtitle">
          Visualize estatísticas e gere relatórios sobre seus agendamentos.
        </p>
      </div>

      <RelatoriosDashboard empresaId={professor.empresa_id} />
    </div>
  )
}
