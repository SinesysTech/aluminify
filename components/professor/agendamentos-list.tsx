"use client"

import { AgendamentoComDetalhes } from "@/app/actions/agendamentos"
import { AgendamentoCard } from "./agendamento-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { CalendarX } from "lucide-react"

interface AgendamentosListProps {
  agendamentos: AgendamentoComDetalhes[]
  showActions?: boolean
  emptyMessage?: string
}

export function AgendamentosList({
  agendamentos,
  showActions = true,
  emptyMessage = "Nenhum agendamento encontrado"
}: AgendamentosListProps) {
  if (agendamentos.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Sem agendamentos</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-3">
      {agendamentos.map((agendamento) => (
        <AgendamentoCard
          key={agendamento.id}
          agendamento={agendamento}
          showActions={showActions}
        />
      ))}
    </div>
  )
}
