import { BloqueiosManager } from "@/components/professor/bloqueios-manager"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function BloqueiosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get professor's empresa_id and admin status
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id, admin")
    .eq("id", user.id)
    .single()

  if (!professor?.empresa_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Bloqueios</h1>
          <p className="text-muted-foreground">
            Voce precisa estar vinculado a uma empresa para gerenciar bloqueios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bloqueios de Agenda</h1>
        <p className="text-muted-foreground">
          Gerencie periodos de indisponibilidade como feriados, recessos e imprevistos.
        </p>
      </div>

      <BloqueiosManager
        professorId={user.id}
        empresaId={professor.empresa_id}
        isAdmin={professor.admin === true}
      />
    </div>
  )
}
