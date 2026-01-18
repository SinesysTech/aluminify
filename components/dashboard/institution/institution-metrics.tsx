'use client'

import { Users, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import type { InstitutionSummary, InstitutionEngagement } from '@/types/dashboard-institution'

interface InstitutionMetricsProps {
  summary: InstitutionSummary
  engagement: InstitutionEngagement
}

export function InstitutionMetrics({ summary, engagement }: InstitutionMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <MetricCard
        label="Alunos Ativos"
        value={summary.alunosAtivos}
        subtext={`de ${summary.totalAlunos} total`}
        icon={Users}
        tooltip={[
          'Alunos que tiveram alguma atividade de estudo nos Ãºltimos 30 dias.',
          'Isso inclui assistir aulas, resolver questÃµes ou revisar flashcards.',
        ]}
      />
      <MetricCard
        label="Horas de Estudo"
        value={engagement.totalHorasEstudo}
        icon={Clock}
        trend={{
          value: engagement.horasEstudoDelta,
          isPositive: engagement.horasEstudoDelta.startsWith('+'),
        }}
        tooltip={[
          'Total de horas de estudo de todos os alunos no perÃ­odo.',
          'O valor mostra a variaÃ§Ã£o em relaÃ§Ã£o ao perÃ­odo anterior.',
        ]}
      />
      <MetricCard
        label="Atividades ConcluÃ­das"
        value={engagement.atividadesConcluidas}
        subtext="no perÃ­odo"
        icon={CheckCircle2}
        tooltip={[
          'Quantidade de aulas marcadas como assistidas no cronograma.',
          'Representa o progresso coletivo dos alunos.',
        ]}
      />
      <MetricCard
        label="Taxa de ConclusÃ£o"
        value={`${engagement.taxaConclusao}%`}
        showProgressCircle={true}
        progressValue={engagement.taxaConclusao}
        tooltip={[
          'Percentual de atividades concluÃ­das em relaÃ§Ã£o ao total programado.',
          'Quanto maior, melhor o engajamento dos alunos com o cronograma.',
        ]}
      />
    </div>
  )
}
