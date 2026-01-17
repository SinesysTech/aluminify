import { ProfessorSelector } from "@/components/agendamento/professor-selector"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getProfessoresDisponiveis } from "@/app/actions/agendamentos"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function AgendamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch available professors
  const professores = await getProfessoresDisponiveis()

  return (
    <main className="flex min-h-screen flex-col py-8 px-4 md:py-16 md:px-5 gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 items-center lg:px-10">
        <h1 className="font-bold text-3xl md:text-4xl">Agendar Mentoria</h1>
        <p className="font-medium text-lg text-muted-foreground text-center px-4 md:px-10">
          Escolha um professor para agendar sua sessao de mentoria ou duvidas.
        </p>
      </div>

      <div className="my-4">
        <Suspense fallback={<ProfessorSelectorSkeleton />}>
          <ProfessorSelector professores={professores} />
        </Suspense>
      </div>
    </main>
  )
}

function ProfessorSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
