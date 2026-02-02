'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InstitutionDashboardData } from '@/app/[tenant]/(modules)/dashboard/types'
import {
  fetchInstitutionDashboardData,
  type InstitutionDashboardServiceError,
} from '@/app/shared/core/services/institutionDashboardService'
import { InstitutionMetrics } from './institution-metrics'
import { ProfessorRankingList } from './professor-ranking-list'
import { DisciplinaPerformanceList } from './disciplina-performance'
import { ConsistencyHeatmap, type HeatmapPeriod } from '@/app/[tenant]/(modules)/dashboard/components/consistency-heatmap'
import { DashboardSkeleton } from '@/app/[tenant]/(modules)/dashboard/components/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/app/shared/components/feedback/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/forms/select'
import {
  WelcomeCard,
  StudentSuccessCard,
  ProgressStatisticsCard,
  LeaderboardCard,
  ChartMostActivity,
} from '../cards'

// Intervalo de refresh automático (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

type DashboardPeriod = 'semanal' | 'mensal' | 'anual'

export default function InstitutionDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<InstitutionDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState<DashboardPeriod>('mensal')
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use a ref to track the latest abort controller to cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Stable refs to avoid recreating the callback on every render
  const periodRef = useRef(period)
  periodRef.current = period
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const routerRef = useRef(router)
  routerRef.current = router
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const loadDashboardData = useCallback(
    async (showRefreshing = false, newPeriod?: DashboardPeriod) => {
      // Cancelar requisição anterior se houver
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      const periodToUse = newPeriod ?? periodRef.current
      try {
        if (showRefreshing) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const dashboardData = await fetchInstitutionDashboardData(periodToUse, controller.signal)

        if (controller.signal.aborted) return

        setData(dashboardData)
      } catch (err) {
        if (controller.signal.aborted) return

        const typed = err as InstitutionDashboardServiceError
        const isExpectedAuthError = !!typed?.isAuthError || !!typed?.isForbidden
          ; (isExpectedAuthError ? console.warn : console.error)(
            'Erro ao carregar dados do dashboard:',
            err
          )

        let errorMessage = 'Erro ao carregar dados do dashboard'
        if (err instanceof Error) {
          errorMessage = err.message

          if ((err as InstitutionDashboardServiceError).isAuthError) {
            errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.'
          } else if ((err as InstitutionDashboardServiceError).isForbidden) {
            errorMessage = 'Você não tem permissão de administrador da instituição para acessar este dashboard.'
          } else if ((err as InstitutionDashboardServiceError).isNetworkError) {
            errorMessage =
              'Erro de conexão. Verifique sua internet e tente novamente.'
          }
        }

        setError(errorMessage)

        if ((err as InstitutionDashboardServiceError).isAuthError) {
          setData(null)
          const currentPathname = pathnameRef.current
          const currentSearchParams = searchParamsRef.current
          const qs = currentSearchParams?.toString()
          const returnUrl = `${currentPathname}${qs ? `?${qs}` : ''}`
          const firstSegment = currentPathname.split('/').filter(Boolean)[0]
          const loginBase =
            firstSegment && firstSegment !== 'auth' ? `/${firstSegment}/auth/login` : '/auth/login'
          routerRef.current.replace(`${loginBase}?next=${encodeURIComponent(returnUrl)}`)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
          abortControllerRef.current = null
        }
      }
    },
    [] // Stable: no deps, uses refs for mutable values
  )

  // Carregamento inicial (runs once on mount)
  useEffect(() => {
    loadDashboardData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadDashboardData])

  // Handler para mudança de período
  const handlePeriodChange = useCallback(
    (newPeriod: DashboardPeriod) => {
      setPeriod(newPeriod)
      loadDashboardData(true, newPeriod)
    },
    [loadDashboardData]
  )

  // Refresh automático
  useEffect(() => {
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
      <div className="flex items-center justify-center min-h-100">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  // Preparar dados para o leaderboard a partir do ranking existente
  const leaderboardData = (data.rankingAlunos ?? []).slice(0, 5).map((s) => ({
    id: s.id,
    name: s.name,
    points: Math.round(parseFloat(s.horasEstudo) || 0),
    avatarUrl: s.avatarUrl ?? undefined,
  }))

  // Calcular taxa de sucesso
  const totalAlunos = data.summary.totalAlunos || 1
  const alunosAtivos = data.summary.alunosAtivos || 0
  const currentSuccessRate = totalAlunos > 0 ? Math.round((alunosAtivos / totalAlunos) * 100) : 0

  // Preparar dados de distribuicao por disciplina para ChartMostActivity
  const disciplinaChartData = (data.performanceByDisciplina ?? []).slice(0, 5).map((d, i) => {
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
    return {
      source: d.name.toLowerCase().replace(/\s+/g, '-'),
      label: d.name,
      percentage: d.aproveitamento,
      color: colors[i % colors.length],
    }
  })

  // Extrair tenant do pathname para construir links
  const tenant = pathname.split('/').filter(Boolean)[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      {/* WelcomeCard */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <WelcomeCard
            userName={data.userName ?? 'Administrador'}
            subtitle={data.empresaNome ?? 'Painel Institucional'}
            description="Acompanhe o desempenho da sua instituicao, alunos e professores."
            ctaLabel="Gerenciar Alunos"
            ctaHref={`/${tenant}/alunos`}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2 justify-end">
        <Select value={period} onValueChange={(v) => handlePeriodChange(v as DashboardPeriod)}>
          <SelectTrigger className="w-30 h-9 text-sm">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
          aria-label="Atualizar dados"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Mensagem de erro */}
      {error && data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Conteudo principal com indicador de refresh */}
      <div className={cn("space-y-6 md:space-y-8 transition-opacity duration-200", isRefreshing && "opacity-50")}>
        {/* Linha 1: StudentSuccess + ProgressStatistics + Leaderboard */}
        <div className="grid gap-4 xl:grid-cols-3">
          <StudentSuccessCard
            currentSuccessRate={currentSuccessRate}
            previousSuccessRate={Math.max(0, currentSuccessRate - 2)}
            totalStudents={totalAlunos}
            passingStudents={alunosAtivos}
            title="Taxa de Engajamento"
            totalLabel="Total de Alunos"
            passingLabel="Alunos Ativos"
          />
          <ProgressStatisticsCard
            totalActivityPercent={data.engagement?.taxaConclusao ?? 0}
            inProgressCount={data.summary.totalCursos}
            completedCount={data.summary.alunosAtivos}
            title="Visão Geral"
            inProgressLabel="Cursos Ativos"
            completedLabel="Alunos Ativos"
          />
          <LeaderboardCard
            students={leaderboardData}
            title="Top Alunos"
            pointsLabel="hrs"
            onViewAll={() => routerRef.current.push(`/${tenant}/alunos`)}
          />
        </div>

        {/* Linha 2: ChartMostActivity + Metricas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ChartMostActivity data={disciplinaChartData} title="Aproveitamento por Disciplina" />
          <InstitutionMetrics summary={data.summary} engagement={data.engagement} />
        </div>

        {/* Heatmap de atividade */}
        <ConsistencyHeatmap
          data={data.heatmap}
          period={period as HeatmapPeriod}
          onPeriodChange={(p) => handlePeriodChange(p as DashboardPeriod)}
          showPeriodButtons={false}
        />

        {/* Ranking de professores */}
        <ProfessorRankingList professors={data.rankingProfessores} />

        {/* Performance por disciplina */}
        <DisciplinaPerformanceList disciplinas={data.performanceByDisciplina} />
      </div>
    </div>
  )
}