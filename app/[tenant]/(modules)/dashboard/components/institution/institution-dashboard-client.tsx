'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, AlertCircle } from 'lucide-react'
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
  const [, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState<DashboardPeriod>('mensal')
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadDashboardData = useCallback(
    async (showRefreshing = false, newPeriod?: DashboardPeriod) => {
      const periodToUse = newPeriod ?? period
      try {
        if (showRefreshing) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const dashboardData = await fetchInstitutionDashboardData(periodToUse)
        setData(dashboardData)
      } catch (err) {
        const typed = err as InstitutionDashboardServiceError
        const isExpectedAuthError = !!typed?.isAuthError || !!typed?.isForbidden
        ;(isExpectedAuthError ? console.warn : console.error)(
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
          const qs = searchParams?.toString()
          const returnUrl = `${pathname}${qs ? `?${qs}` : ''}`
          const firstSegment = pathname.split('/').filter(Boolean)[0]
          const loginBase =
            firstSegment && firstSegment !== 'auth' ? `/${firstSegment}/auth/login` : '/auth/login'
          router.replace(`${loginBase}?next=${encodeURIComponent(returnUrl)}`)
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [period, pathname, router, searchParams]
  )

  // Carregamento inicial
  useEffect(() => {
    loadDashboardData()
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      {/* Header com filtro de período */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <InstitutionHeader
          userName={data.userName}
          empresaNome={data.empresaNome}
          totalAlunos={data.summary.totalAlunos}
          totalProfessores={data.summary.totalProfessores}
          totalCursos={data.summary.totalCursos}
        />
        <div className="flex items-center gap-2 shrink-0">
          <Select value={period} onValueChange={(v) => handlePeriodChange(v as DashboardPeriod)}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
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
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mensagem de erro (se houver dados mas tambem erro) */}
      {error && data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Metricas principais */}
      <InstitutionMetrics summary={data.summary} engagement={data.engagement} />

      {/* Heatmap de atividade */}
      <ConsistencyHeatmap
        data={data.heatmap}
        period={period as HeatmapPeriod}
        onPeriodChange={(p) => handlePeriodChange(p as DashboardPeriod)}
      />

      {/* Rankings lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StudentRankingList students={data.rankingAlunos} />
        <ProfessorRankingList professors={data.rankingProfessores} />
      </div>

      {/* Performance por disciplina */}
      <DisciplinaPerformanceList disciplinas={data.performanceByDisciplina} />
    </div>
  )
}