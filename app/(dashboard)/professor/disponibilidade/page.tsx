import { AvailabilityManager } from "@/components/professor/availability-manager"
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

  // Verify role if needed, but RLS protects data. 
  // Ideally we check if user is professor here too.

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Disponibilidade</h1>
        <p className="text-muted-foreground">
          Gerencie seus horários de atendimento para mentoria.
        </p>
      </div>

      <AvailabilityManager professorId={user.id} />
    </div>
  )
}
