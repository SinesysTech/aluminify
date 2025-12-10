"use client"

import { NotificacaoAgendamento, getNotificacaoMessage } from "@/app/actions/notificacoes"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarPlus,
  CheckCircle,
  XCircle,
  Ban,
  Bell,
  Edit
} from "lucide-react"
import Link from "next/link"

interface NotificationItemProps {
  notificacao: NotificacaoAgendamento
  userId: string
}

const iconMap = {
  criacao: CalendarPlus,
  confirmacao: CheckCircle,
  cancelamento: XCircle,
  rejeicao: Ban,
  lembrete: Bell,
  alteracao: Edit
}

const iconColorMap = {
  criacao: "text-blue-500",
  confirmacao: "text-emerald-500",
  cancelamento: "text-red-500",
  rejeicao: "text-red-500",
  lembrete: "text-amber-500",
  alteracao: "text-purple-500"
}

export function NotificationItem({ notificacao, userId }: NotificationItemProps) {
  const Icon = iconMap[notificacao.tipo] || Bell
  const iconColor = iconColorMap[notificacao.tipo] || "text-gray-500"
  const message = getNotificacaoMessage(notificacao, userId)
  const timeAgo = formatDistanceToNow(new Date(notificacao.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  const isProfessor = notificacao.agendamento?.professor_id === userId
  const link = isProfessor
    ? `/professor/agendamentos/${notificacao.agendamento_id}`
    : `/meus-agendamentos`

  return (
    <Link
      href={link}
      className="flex items-start gap-3 p-3 hover:bg-accent transition-colors"
    >
      <div className={`mt-0.5 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </Link>
  )
}
