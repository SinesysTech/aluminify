"use client"

import { AgendamentoComDetalhes } from "@/app/[tenant]/(dashboard)/agendamentos/lib/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AgendamentoActions } from "./agendamento-actions"
import { format, formatDistanceToNow, isFuture, differenceInHours } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, Video, MessageSquare } from "lucide-react"
import Link from "next/link"

interface AgendamentoCardProps {
  agendamento: AgendamentoComDetalhes
  showActions?: boolean
}

export function AgendamentoCard({ agendamento, showActions = true }: AgendamentoCardProps) {
  const dataInicio = new Date(agendamento.data_inicio)
  const dataFim = new Date(agendamento.data_fim)
  const isUpcoming = isFuture(dataInicio)
  const hoursUntil = differenceInHours(dataInicio, new Date())

  const statusConfig = {
    pendente: { label: "Pendente", variant: "outline" as const, className: "border-amber-500 text-amber-600" },
    confirmado: { label: "Confirmado", variant: "default" as const, className: "bg-emerald-500" },
    cancelado: { label: "Cancelado", variant: "destructive" as const, className: "" },
    concluido: { label: "Concluido", variant: "secondary" as const, className: "" }
  }

  const status = statusConfig[agendamento.status]
  const aluno = agendamento.aluno

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Aluno Info */}
          <Link
            href={`/agendamentos/detalhes/${agendamento.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={aluno?.avatar_url || undefined} />
              <AvatarFallback>
                {aluno ? getInitials(aluno.nome) : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {aluno?.nome || "Aluno desconhecido"}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {aluno?.email}
              </p>
            </div>
          </Link>

          {/* Date/Time Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
              </span>
            </div>
          </div>

          {/* Status & Time indicator */}
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
            {isUpcoming && agendamento.status === "confirmado" && (
              <span className={`text-xs ${hoursUntil <= 24 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                {formatDistanceToNow(dataInicio, { locale: ptBR, addSuffix: true })}
              </span>
            )}
          </div>

          {/* Meeting Link indicator */}
          {agendamento.link_reuniao && agendamento.status === "confirmado" && (
            <a
              href={agendamento.link_reuniao}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Video className="h-4 w-4" />
              <span className="hidden md:inline">Entrar</span>
            </a>
          )}

          {/* Observacoes indicator */}
          {agendamento.observacoes && (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          )}

          {/* Actions */}
          {showActions && agendamento.status === "pendente" && (
            <AgendamentoActions agendamento={agendamento} />
          )}
        </div>

        {/* Motivo cancelamento */}
        {agendamento.status === "cancelado" && agendamento.motivo_cancelamento && (
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            <span className="font-medium">Motivo:</span> {agendamento.motivo_cancelamento}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
