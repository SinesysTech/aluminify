'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import type { ProfessorDashboardData } from '@/app/[tenant]/(modules)/dashboard/types'
import {
  fetchProfessorDashboardData,
  type ProfessorDashboardServiceError,
} from '@/app/shared/core/services/professorDashboardService'
import { ProfessorMetrics } from '../professor-metrics'
import { StudentsUnderCareList } from '@/app/[tenant]/(modules)/usuario/components/students-under-care-list'
import { UpcomingAppointments } from '@/app/[tenant]/(modules)/agendamentos/components/upcoming-appointments'
import { ProfessorDisciplinaPerformanceList } from '../professor-disciplina-performance'
import { DashboardSkeleton } from '../dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/app/shared/components/feedback/alert'
import {
  WelcomeCard,
  StudentSuccessCard,
  ProgressStatisticsCard,
  LeaderboardCard,
  ChartMostActivity,
} from '../cards'

// Intervalo de refresh automático (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

export default function ProfessorDashboardClient() {
  const [data, setData] = useState<ProfessorDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setIsRefreshing] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const dashboardData = await fetchProfessorDashboardData()
      setData(dashboardData)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)

      let errorMessage = 'Erro ao carregar dados do dashboard'
      if (err instanceof Error) {
        errorMessage = err.message

        if ((err as ProfessorDashboardServiceError).isAuthError) {
          errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.'
        } else if ((err as ProfessorDashboardServiceError).isNetworkError) {
          errorMessage =
            'Erro de conexão. Verifique sua internet e tente novamente.'
        }
      }

      setError(errorMessage)

      if ((err as ProfessorDashboardServiceError).isAuthError) {
        setData(null)
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Carregamento inicial
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Refresh automático
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    refreshIntervalRef.current = setInterval(() => {
      loadDashboardData(true)
    }, AUTO_REFRESH_INTERVAL)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [loadDashboardData])

  // Função para refresh manual
  const handleManualRefresh = () => {
    loadDashboardData(true)
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  // Preparar dados para o leaderboard a partir dos alunos sob cuidado
  const leaderboardData = (data.alunos ?? []).slice(0, 4).map((s) => ({
    id: s.id,
    name: s.name,
    points: Math.round(s.aproveitamento || 0),
    avatarUrl: s.avatarUrl ?? undefined,
  }))

  // Calcular taxa de sucesso dos alunos (alunos com aproveitamento >= 60%)
  const totalAlunos = data.alunos?.length || 0
  const alunosAprovados = (data.alunos ?? []).filter((a) => a.aproveitamento >= 60).length
  const currentSuccessRate = totalAlunos > 0 ? Math.round((alunosAprovados / totalAlunos) * 100) : 0

  // Preparar dados de disciplinas para ChartMostActivity
  const disciplinaChartData = (data.performanceAlunos ?? []).slice(0, 5).map((d, i) => {
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
    return {
      source: d.id,
      label: d.name,
      percentage: d.aproveitamentoMedio,
      color: colors[i % colors.length],
    }
  })

  // Total de agendamentos para ProgressStatistics
  const totalAgendamentos = (data.summary.agendamentosPendentes || 0) + (data.summary.agendamentosRealizadosMes || 0)
  const taxaConclusaoAgendamentos = totalAgendamentos > 0
    ? Math.round((data.summary.agendamentosRealizadosMes / totalAgendamentos) * 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      {/* ===== NOVO LAYOUT (Template) ===== */}

      {/* WelcomeCard + Controle de Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <WelcomeCard
            userName={data.professorNome}
            subtitle="Painel do Professor"
            description="Acompanhe seus alunos, agendamentos e desempenho por disciplina."
            ctaLabel="Ver Alunos"
          />
        </div>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Mensagem de erro (se houver dados mas também erro) */}
      {error && data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Linha 1: StudentSuccess + ProgressStatistics + Leaderboard */}
      <div className="grid gap-4 xl:grid-cols-3">
        <StudentSuccessCard
          currentSuccessRate={currentSuccessRate}
          previousSuccessRate={Math.max(0, currentSuccessRate - 2)}
          totalStudents={totalAlunos}
          passingStudents={alunosAprovados}
          title="Taxa de Sucesso dos Alunos"
          totalLabel="Total de Alunos"
          passingLabel="Alunos Aprovados"
        />
        <ProgressStatisticsCard
          totalActivityPercent={taxaConclusaoAgendamentos}
          inProgressCount={data.summary.agendamentosPendentes}
          completedCount={data.summary.agendamentosRealizadosMes}
          title="Agendamentos"
          inProgressLabel="Pendentes"
          completedLabel="Realizados no Mes"
        />
        <LeaderboardCard
          students={leaderboardData}
          title="Top Alunos"
          pointsLabel="pts"
        />
      </div>

      {/* Linha 2: ChartMostActivity + Metricas legadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartMostActivity data={disciplinaChartData} title="Aproveitamento por Disciplina" />
        <ProfessorMetrics summary={data.summary} />
      </div>

      {/* ===== SECAO EXISTENTE ===== */}

      {/* Próximos agendamentos (largura total) */}
      <UpcomingAppointments appointments={data.agendamentos} />

      {/* Alunos e Performance lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StudentsUnderCareList students={data.alunos} />
        <ProfessorDisciplinaPerformanceList disciplinas={data.performanceAlunos} />
      </div>
    </div>
  )
}