import { RecorrenciaManager } from "@/components/professor/recorrencia-manager"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function DisponibilidadePage() {
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
          <h1 className="page-title">Disponibilidade</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para configurar disponibilidade.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Disponibilidade</h1>
        <p className="page-subtitle">
          Configure seus horários de atendimento para mentoria.
        </p>
      </div>

      <RecorrenciaManager professorId={user.id} empresaId={professor.empresa_id} />
    </div>
  )
}
