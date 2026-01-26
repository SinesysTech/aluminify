import type { Metadata } from 'next'
import { createClient } from "@/app/shared/core/server"
import { redirect } from "next/navigation"
import { getAgendamentosAluno } from "@/app/[tenant]/(modules)/agendamentos/lib/actions";
import { MeusAgendamentosList } from "../components/meus-agendamentos-list"
import { Suspense } from "react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: 'Meus Agendamentos'
}

export default async function MeusAgendamentosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const agendamentos = await getAgendamentosAluno(user.id)

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Meus Agendamentos</h1>
          <p className="page-subtitle">
            Visualize e gerencie suas sessões de mentoria agendadas.
          </p>
        </div>
        <Button asChild>
          <Link href="/agendamentos">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      <Suspense fallback={<AgendamentosSkeleton />}>
        <MeusAgendamentosList agendamentos={agendamentos} />
      </Suspense>
    </div>
  )
}

function AgendamentosSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}