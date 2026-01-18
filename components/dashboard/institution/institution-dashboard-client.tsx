'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import type { InstitutionDashboardData } from '@/types/dashboard-institution'
import {
  fetchInstitutionDashboardData,
  type InstitutionDashboardServiceError,
} from '@/lib/services/institutionDashboardService'
import { InstitutionHeader } from './institution-header'
import { InstitutionMetrics } from './institution-metrics'
import { StudentRankingList } from './student-ranking-list'
import { ProfessorRankingList } from './professor-ranking-list'
import { DisciplinaPerformanceList } from './disciplina-performance'
import { ConsistencyHeatmap, type HeatmapPeriod } from '@/components/dashboard/consistency-heatmap'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Intervalo de refresh automÃ¡tico (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

type DashboardPeriod = 'semanal' | 'mensal' | 'anual'

export default function InstitutionDashboardClient() {
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
        console.error('Erro ao carregar dados do dashboard:', err)

        let errorMessage = 'Erro ao carregar dados do dashboard'
        if (err instanceof Error) {
          errorMessage = err.message

          if ((err as InstitutionDashboardServiceError).isAuthError) {
            errorMessage = 'Sua sessÃ£o expirou. Por favor, faÃ§a login novamente.'
          } else if ((err as InstitutionDashboardServiceError).isForbidden) {
            errorMessage = 'VocÃª nÃ£o tem permissÃ£o de administrador da instituiÃ§Ã£o para acessar este dashboard.'
          } else if ((err as InstitutionDashboardServiceError).isNetworkError) {
            errorMessage =
              'Erro de conexÃ£o. Verifique sua internet e tente novamente.'
          }
        }

        setError(errorMessage)

        if ((err as InstitutionDashboardServiceError).isAuthError) {
          setData(null)
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [period]
  )

  // Carregamento inicial
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Handler para mudanÃ§a de perÃ­odo
  const handlePeriodChange = useCallback(
    (newPeriod: DashboardPeriod) => {
      setPeriod(newPeriod)
      loadDashboardData(true, newPeriod)
    },
    [loadDashboardData]
  )

  // Refresh automÃ¡tico
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

  // FunÃ§Ã£o para refresh manual
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
        <p className="text-muted-foreground">Nenhum dado disponÃ­vel</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtro de periodo */}
      <div className="flex items-start justify-between gap-4">
        <InstitutionHeader
          empresaNome={data.empresaNome}
          totalAlunos={data.summary.totalAlunos}
          totalProfessores={data.summary.totalProfessores}
          totalCursos={data.summary.totalCursos}
        />
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => handlePeriodChange(v as DashboardPeriod)}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentRankingList students={data.rankingAlunos} />
        <ProfessorRankingList professors={data.rankingProfessores} />
      </div>

      {/* Performance por disciplina */}
      <DisciplinaPerformanceList disciplinas={data.performanceByDisciplina} />
    </div>
  )
}
