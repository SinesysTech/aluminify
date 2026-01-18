'use client'

import { Users, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import type { ProfessorSummary } from '@/types/dashboard-professor'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProfessorMetricsProps {
  summary: ProfessorSummary
}

export function ProfessorMetrics({ summary }: ProfessorMetricsProps) {
  // Formatar prÃ³ximo agendamento
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
          'NÃºmero de alunos Ãºnicos que vocÃª atendeu em agendamentos.',
          'Inclui todos os alunos com pelo menos um agendamento realizado.',
        ]}
      />
      <MetricCard
        label="Agendamentos Pendentes"
        value={summary.agendamentosPendentes}
        subtext="prÃ³ximos"
        icon={Calendar}
        tooltip={[
          'Agendamentos futuros que ainda nÃ£o foram realizados.',
          'Inclui agendamentos pendentes e confirmados.',
        ]}
      />
      <MetricCard
        label="Realizados no MÃªs"
        value={summary.agendamentosRealizadosMes}
        subtext="agendamentos"
        icon={CheckCircle2}
        tooltip={[
          'Agendamentos concluÃ­dos neste mÃªs.',
          'Conta apenas agendamentos marcados como realizados.',
        ]}
      />
      <MetricCard
        label="PrÃ³ximo Agendamento"
        value={summary.proximoAgendamento ? formatNextAppointment() : '-'}
        subtext={summary.proximoAgendamento ? 'agendado' : 'nenhum'}
        icon={Clock}
        tooltip={[
          'Quando serÃ¡ seu prÃ³ximo agendamento.',
          'Mostra o tempo restante atÃ© o prÃ³ximo atendimento.',
        ]}
      />
    </div>
  )
}
