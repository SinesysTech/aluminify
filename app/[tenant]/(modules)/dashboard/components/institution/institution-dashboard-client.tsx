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
import { InstitutionHeader } from './institution-header'
import { InstitutionMetrics } from './institution-metrics'
import { StudentRankingList } from './student-ranking-list'
import { ProfessorRankingList } from './professor-ranking-list'
import { DisciplinaPerformanceList } from './disciplina-performance'
import { DisciplineChart } from './discipline-chart'
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

  const abortControllerRef = useRef<AbortController | null>(null)

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
    []
  )

  useEffect(() => {
    loadDashboardData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadDashboardData])

  const handlePeriodChange = useCallback(
    (newPeriod: DashboardPeriod) => {
      setPeriod(newPeriod)
      loadDashboardData(true, newPeriod)
    },
    [loadDashboardData]
  )

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header: Greeting + Institution + Controls ── */}
      <InstitutionHeader
        userName={data.userName ?? 'Administrador'}
        empresaNome={data.empresaNome ?? 'Painel Institucional'}
        totalAlunos={data.summary.totalAlunos}
        totalProfessores={data.summary.totalProfessores}
        totalCursos={data.summary.totalCursos}
        controls={
          <>
            <Select value={period} onValueChange={(v) => handlePeriodChange(v as DashboardPeriod)}>
              <SelectTrigger className="w-30 h-9 text-sm">
                <SelectValue placeholder="Período" />
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
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </>
        }
      />

      {/* Error banner (stale data warning) */}
      {error && data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Main content with refresh opacity indicator */}
      <div className={cn('space-y-6 transition-opacity duration-200', isRefreshing && 'opacity-50')}>
        {/* ── KPI Cards Row ── */}
        <InstitutionMetrics summary={data.summary} engagement={data.engagement} />

        {/* ── Visualization: Discipline Chart + Top Alunos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <DisciplineChart disciplinas={data.performanceByDisciplina} />
          </div>
          <div className="lg:col-span-2">
            <StudentRankingList students={data.rankingAlunos} />
          </div>
        </div>

        {/* ── Consistency Heatmap ── */}
        <ConsistencyHeatmap
          data={data.heatmap}
          period={period as HeatmapPeriod}
          onPeriodChange={(p) => handlePeriodChange(p as DashboardPeriod)}
          showPeriodButtons={false}
        />

        {/* ── Rankings: Professores + Disciplina Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfessorRankingList professors={data.rankingProfessores} />
          <DisciplinaPerformanceList disciplinas={data.performanceByDisciplina} />
        </div>
      </div>
    </div>
  )
}
