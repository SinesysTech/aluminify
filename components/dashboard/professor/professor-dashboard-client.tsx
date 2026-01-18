'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import type { ProfessorDashboardData } from '@/types/dashboard-professor'
import {
  fetchProfessorDashboardData,
  type ProfessorDashboardServiceError,
} from '@/lib/services/professorDashboardService'
import { ProfessorHeader } from './professor-header'
import { ProfessorMetrics } from './professor-metrics'
import { StudentsUnderCareList } from './students-under-care-list'
import { UpcomingAppointments } from './upcoming-appointments'
import { ProfessorDisciplinaPerformanceList } from './professor-disciplina-performance'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Intervalo de refresh automÃ¡tico (5 minutos)
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
          errorMessage = 'Sua sessÃ£o expirou. Por favor, faÃ§a login novamente.'
        } else if ((err as ProfessorDashboardServiceError).isNetworkError) {
          errorMessage =
            'Erro de conexÃ£o. Verifique sua internet e tente novamente.'
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
    <div className="mx-auto max-w-7xl">
      {/* Header com botÃ£o de refresh */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <ProfessorHeader professorNome={data.professorNome} />
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Mensagem de erro (se houver dados mas tambÃ©m erro) */}
      {error && data && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* MÃ©tricas principais */}
      <ProfessorMetrics summary={data.summary} />

      {/* PrÃ³ximos agendamentos (largura total) */}
      <div className="mb-8">
        <UpcomingAppointments appointments={data.agendamentos} />
      </div>

      {/* Alunos e Performance lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsUnderCareList students={data.alunos} />
        <ProfessorDisciplinaPerformanceList disciplinas={data.performanceAlunos} />
      </div>
    </div>
  )
}
