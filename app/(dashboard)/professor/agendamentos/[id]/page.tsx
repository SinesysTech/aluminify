import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { getAgendamentoById } from "@/app/actions/agendamentos"
import { AgendamentoDetails } from "@/components/professor/agendamento-details"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import * as React from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AgendamentoDetailPage({ params }: PageProps) {
  // Desempacotar imediatamente para evitar serialização pelo React DevTools
  const { id } = React.use(params)
  const supabase = React.use(createClient())
  const {
    data: { user },
  } = React.use(supabase.auth.getUser())

  if (!user) {
    redirect("/auth/professor/login")
  }

  const agendamento = React.use(getAgendamentoById(id))

  if (!agendamento || agendamento.professor_id !== user.id) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professor/agendamentos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Detalhes do Agendamento
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie este agendamento
          </p>
        </div>
      </div>

      <AgendamentoDetails agendamento={agendamento} />
    </div>
  )
}
