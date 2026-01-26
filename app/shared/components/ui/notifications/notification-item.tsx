"use client"

import { NotificacaoAgendamento, getNotificacaoMessage } from "@/app/[tenant]/(modules)/agendamentos/lib/notificacoes-actions"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarPlus,
  CheckCircle,
  XCircle,
  Ban,
  Bell,
  Edit,
  ShieldX,
  CalendarRange,
  RefreshCw
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
  alteracao: Edit,
  bloqueio_criado: ShieldX,
  recorrencia_alterada: CalendarRange,
  substituicao_solicitada: RefreshCw
}

const iconColorMap = {
  criacao: "text-blue-500",
  confirmacao: "text-emerald-500",
  cancelamento: "text-red-500",
  rejeicao: "text-red-500",
  lembrete: "text-amber-500",
  alteracao: "text-purple-500",
  bloqueio_criado: "text-orange-500",
  recorrencia_alterada: "text-indigo-500",
  substituicao_solicitada: "text-cyan-500"
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
    ? `/agendamentos/detalhes/${notificacao.agendamento_id}`
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
