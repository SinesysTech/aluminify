
import { createClient } from "@/app/shared/core/server"
import { redirect } from "next/navigation"
import { RelatoriosDashboard } from "../../components/relatorios-dashboard"

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
    .select("empresa_id")
    .eq("id", user.id)
    .single()

  if (!professor?.empresa_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para visualizar os relatórios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Relatórios de Desempenho</h1>
        <p className="page-subtitle">
          Acompanhe os indicadores das suas mentorias.
        </p>
      </div>

      <RelatoriosDashboard professorId={user.id} empresaId={professor.empresa_id} />
    </div>
  )
}
