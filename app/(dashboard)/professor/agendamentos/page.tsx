import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getAgendamentosProfessor, getAgendamentoStats } from "@/app/actions/agendamentos"
import { AgendamentosDashboard } from "@/components/professor/agendamentos-dashboard"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ProfessorAgendamentosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/professor/login")
  }

  const [agendamentos, stats] = await Promise.all([
    getAgendamentosProfessor(user.id),
    getAgendamentoStats(user.id)
  ])

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie os agendamentos de mentoria dos seus alunos.
        </p>
      </div>

      <Suspense fallback={<AgendamentosSkeleton />}>
        <AgendamentosDashboard
          agendamentos={agendamentos}
          stats={stats}
          professorId={user.id}
        />
      </Suspense>
    </div>
  )
}

function AgendamentosSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
