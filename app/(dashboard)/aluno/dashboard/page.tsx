'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Clock, CheckCircle2, Brain, RefreshCw, AlertCircle } from 'lucide-react'
import type { DashboardData } from '@/types/dashboard'
import {
  fetchDashboardData,
  type DashboardServiceError,
} from '@/lib/services/dashboardService'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ScheduleProgress } from '@/components/dashboard/schedule-progress'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ConsistencyHeatmap } from '@/components/dashboard/consistency-heatmap'
import { SubjectPerformanceList } from '@/components/dashboard/subject-performance-list'
import { FocusEfficiencyChart } from '@/components/dashboard/focus-efficiency-chart'
import { SubjectDistribution } from '@/components/dashboard/subject-distribution'
import { StrategicDomain } from '@/components/dashboard/strategic-domain'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Intervalo de refresh automático (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const dashboardData = await fetchDashboardData()
      setData(dashboardData)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)

      let errorMessage = 'Erro ao carregar dados do dashboard'
      if (err instanceof Error) {
        errorMessage = err.message

        // Tratamento específico para erros de autenticação
        if ((err as DashboardServiceError).isAuthError) {
          errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.'
        } else if ((err as DashboardServiceError).isNetworkError) {
          errorMessage =
            'Erro de conexão. Verifique sua internet e tente novamente.'
        }
      }

      setError(errorMessage)

      // Se for erro de autenticação, não mostrar dados mock
      if ((err as DashboardServiceError).isAuthError) {
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
    // Limpar intervalo anterior se existir
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Configurar novo intervalo
    refreshIntervalRef.current = setInterval(() => {
      loadDashboardData(true)
    }, AUTO_REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [loadDashboardData])

  // Subscription Realtime para atualizar dashboard quando aulas são concluídas
  useEffect(() => {
    let channel: any = null
    let supabaseInstance: any = null

    async function setupRealtimeSubscription() {
      const { createClient } = await import('@/lib/client')
      supabaseInstance = createClient()
      
      // Buscar ID do aluno atual
      const { data: { user } } = await supabaseInstance.auth.getUser()
      if (!user) return

      // Buscar cronograma ativo do aluno
      const { data: cronograma } = await supabaseInstance
        .from('cronogramas')
        .select('id')
        .eq('aluno_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cronograma) return

      // Subscription para mudanças em cronograma_itens
      channel = supabaseInstance
        .channel(`dashboard-cronograma-itens-${cronograma.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cronograma_itens',
            filter: `cronograma_id=eq.${cronograma.id}`,
          },
          (payload: any) => {
            console.log('[Dashboard Realtime] Mudança detectada em cronograma_itens:', payload)
            // Recarregar dados do dashboard
            loadDashboardData(true)
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel && supabaseInstance) {
        supabaseInstance.removeChannel(channel)
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
        <p className="text-slate-500 dark:text-slate-400">
          Nenhum dado disponível
        </p>
      </div>
    )
  }

  // Formatar última atualização
  const formatLastRefresh = () => {
    if (!lastRefresh) return null
    const now = new Date()
    const diff = now.getTime() - lastRefresh.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes === 1) return 'Há 1 minuto'
    if (minutes < 60) return `Há ${minutes} minutos`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'Há 1 hora'
    return `Há ${hours} horas`
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Topo: Header e Schedule Progress */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <DashboardHeader user={data.user} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleManualRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
          {lastRefresh && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatLastRefresh()}
            </p>
          )}
        </div>
      </div>

      {/* Mensagem de erro (se houver dados mas também erro) */}
      {error && data && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            {error}. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      <ScheduleProgress value={data.metrics.scheduleProgress} />

      {/* Linha 1: Grid de 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Tempo Focado"
          value={data.metrics.focusTime}
          icon={Clock}
          trend={{
            value: data.metrics.focusTimeDelta,
            isPositive: data.metrics.focusTimeDelta.startsWith('+'),
          }}
        />
        <MetricCard
          label="Questões Feitas"
          value={data.metrics.questionsAnswered}
          subtext={data.metrics.questionsAnsweredPeriod}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Aproveitamento"
          value={`${data.metrics.accuracy}%`}
          showProgressCircle={true}
          progressValue={data.metrics.accuracy}
        />
        <MetricCard
          label="Flashcards"
          value={data.metrics.flashcardsReviewed}
          subtext="Cartas revisadas"
          icon={Brain}
        />
      </div>

      {/* Linha 2: Consistency Heatmap (largura total) */}
      <ConsistencyHeatmap data={data.heatmap} />

      {/* Linha 3: 2 Colunas - Subject Performance List e Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <SubjectPerformanceList subjects={data.subjects} />
        </div>
        <div className="lg:col-span-2">
          <SubjectDistribution data={data.subjectDistribution} />
        </div>
      </div>

      {/* Linha 4: 2 Colunas - Focus Efficiency Chart e Strategic Domain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FocusEfficiencyChart data={data.focusEfficiency} />
        <StrategicDomain data={data.strategicDomain} />
      </div>
    </div>
  )
}

