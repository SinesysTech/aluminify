
import { IntegracaoManager } from "../../components/integracao-manager"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function IntegracoesPage() {
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
          <h1 className="page-title">Integrações</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para gerenciar integrações.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Integrações</h1>
        <p className="page-subtitle">
          Gerencie suas conexões com calendar e videoconferência.
        </p>
      </div>

      <IntegracaoManager professorId={user.id} empresaId={professor.empresa_id} />
    </div>
  )
}
