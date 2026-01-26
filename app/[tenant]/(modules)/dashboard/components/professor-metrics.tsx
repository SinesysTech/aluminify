'use client'

import { Users, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { MetricCard } from './metric-card'
import type { ProfessorSummary } from '@/app/[tenant]/(modules)/dashboard/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProfessorMetricsProps {
  summary: ProfessorSummary
}

export function ProfessorMetrics({ summary }: ProfessorMetricsProps) {
  // Formatar próximo agendamento
  const formatNextAppointment = () => {
    if (!summary.proximoAgendamento) return 'Sem agendamentos'
    try {
      return formatDistanceToNow(new Date(summary.proximoAgendamento), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return 'Em breve'
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Alunos Atendidos"
        value={summary.alunosAtendidos}
        subtext="total de alunos"
        icon={Users}
        tooltip={[
          'Número de alunos únicos que você atendeu em agendamentos.',
          'Inclui todos os alunos com pelo menos um agendamento realizado.',
        ]}
      />
      <MetricCard
        label="Agendamentos Pendentes"
        value={summary.agendamentosPendentes}
        subtext="próximos"
        icon={Calendar}
        tooltip={[
          'Agendamentos futuros que ainda não foram realizados.',
          'Inclui agendamentos pendentes e confirmados.',
        ]}
      />
      <MetricCard
        label="Realizados no Mês"
        value={summary.agendamentosRealizadosMes}
        subtext="agendamentos"
        icon={CheckCircle2}
        tooltip={[
          'Agendamentos concluídos neste mês.',
          'Conta apenas agendamentos marcados como realizados.',
        ]}
      />
      <MetricCard
        label="Próximo Agendamento"
        value={summary.proximoAgendamento ? formatNextAppointment() : '-'}
        subtext={summary.proximoAgendamento ? 'agendado' : 'nenhum'}
        icon={Clock}
        tooltip={[
          'Quando será seu próximo agendamento.',
          'Mostra o tempo restante até o próximo atendimento.',
        ]}
      />
    </div>
  )
}
