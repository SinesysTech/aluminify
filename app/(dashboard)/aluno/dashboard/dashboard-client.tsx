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
import {
  ConsistencyHeatmap,
  type HeatmapPeriod,
} from '@/components/dashboard/consistency-heatmap'
import { SubjectPerformanceList } from '@/components/dashboard/subject-performance-list'
import { FocusEfficiencyChart } from '@/components/dashboard/focus-efficiency-chart'
import { SubjectDistribution } from '@/components/dashboard/subject-distribution'
import { StrategicDomain } from '@/components/dashboard/strategic-domain'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Intervalo de refresh automÃ¡tico (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

export default function StudentDashboardClientPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setIsRefreshing] = useState(false)
  const [, setLastRefresh] = useState<Date | null>(null)
  const [heatmapPeriod, setHeatmapPeriod] = useState<HeatmapPeriod>('anual')
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadDashboardData = useCallback(
    async (showRefreshing = false, period?: HeatmapPeriod) => {
      const periodToUse = period ?? heatmapPeriod
      try {
        if (showRefreshing) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const dashboardData = await fetchDashboardData(periodToUse)
        setData(dashboardData)
        setLastRefresh(new Date())
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)

        let errorMessage = 'Erro ao carregar dados do dashboard'
        if (err instanceof Error) {
          errorMessage = err.message

          // Tratamento especÃ­fico para erros de autenticaÃ§Ã£o
          if ((err as DashboardServiceError).isAuthError) {
            errorMessage = 'Sua sessÃ£o expirou. Por favor, faÃ§a login novamente.'
          } else if ((err as DashboardServiceError).isNetworkError) {
            errorMessage =
              'Erro de conexÃ£o. Verifique sua internet e tente novamente.'
          }
        }

        setError(errorMessage)

        // Se for erro de autenticaÃ§Ã£o, nÃ£o mostrar dados mock
        if ((err as DashboardServiceError).isAuthError) {
          setData(null)
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [heatmapPeriod]
  )

  // Carregamento inicial
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Handler para mudanÃ§a de perÃ­odo do heatmap
  const handleHeatmapPeriodChange = useCallback(
    (period: HeatmapPeriod) => {
      setHeatmapPeriod(period)
      loadDashboardData(true, period)
    },
    [loadDashboardData]
  )

  // Refresh automÃ¡tico
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

  // Subscription Realtime para atualizar dashboard quando aulas sÃ£o concluÃ­das
  useEffect(() => {
    let channel:
      | ReturnType<
          ReturnType<typeof import('@/lib/client').createClient>['channel']
        >
      | null = null
    let supabaseInstance:
      | ReturnType<typeof import('@/lib/client').createClient>
      | null = null

    async function setupRealtimeSubscription() {
      const { createClient } = await import('@/lib/client')
      supabaseInstance = createClient()

      // Buscar ID do aluno atual
      const {
        data: { user },
      } = await supabaseInstance.auth.getUser()
      if (!user) return

      // Buscar cronograma ativo do aluno
      const { data: cronograma } = await supabaseInstance
        .from('cronogramas')
        .select('id')
        .eq('aluno_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>()

      if (!cronograma) return

      // Subscription para mudanÃ§as em cronograma_itens
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
          (payload: {
            new: Record<string, unknown>
            old: Record<string, unknown>
            eventType: string
          }) => {
            console.log(
              '[Dashboard Realtime] MudanÃ§a detectada em cronograma_itens:',
              payload
            )
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
      <div className="flex items-center justify-center min-h-100">
        <p className="text-muted-foreground">Nenhum dado disponÃ­vel</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Topo: Header e Schedule Progress */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <DashboardHeader user={data.user} />
        </div>
      </div>

      {/* Mensagem de erro (se houver dados mas tambÃ©m erro) */}
      {error && data && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>{error}. Dados podem estar desatualizados.</AlertDescription>
        </Alert>
      )}

      <ScheduleProgress value={data.metrics.scheduleProgress} />

      {/* Linha 1: Grid de 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Tempo de Estudo"
          value={data.metrics.focusTime}
          icon={Clock}
          trend={{
            value: data.metrics.focusTimeDelta,
            isPositive: data.metrics.focusTimeDelta.startsWith('+'),
          }}
          tooltip={[
            'Este Ã© o tempo total de estudo no perÃ­odo, somando aulas que vocÃª marcou como assistidas no cronograma e o tempo registrado em listas de exercÃ­cios (sessÃµes vinculadas a uma atividade).',
            'O valor mostra a diferenÃ§a em relaÃ§Ã£o ao perÃ­odo anterior, ajudando vocÃª a acompanhar sua evoluÃ§Ã£o.',
          ]}
        />
        <MetricCard
          label="QuestÃµes Feitas"
          value={data.metrics.questionsAnswered}
          subtext={data.metrics.questionsAnsweredPeriod}
          icon={CheckCircle2}
          tooltip={[
            'Este nÃºmero representa a quantidade total de questÃµes que vocÃª jÃ¡ resolveu no perÃ­odo indicado.',
            'Resolver questÃµes Ã© fundamental para fixar o conteÃºdo e se preparar melhor para as provas.',
          ]}
        />
        <MetricCard
          label="Aproveitamento"
          value={`${data.metrics.accuracy}%`}
          showProgressCircle={true}
          progressValue={data.metrics.accuracy}
          tooltip={[
            'Seu aproveitamento mostra a porcentagem de acertos nas questÃµes que vocÃª resolveu.',
            'Quanto maior o percentual, melhor vocÃª estÃ¡ dominando o conteÃºdo.',
            'Este indicador ajuda a identificar Ã¡reas que precisam de mais estudo.',
          ]}
        />
        <MetricCard
          label="Flashcards"
          value={data.metrics.flashcardsReviewed}
          subtext="Cartas revisadas"
          icon={Brain}
          tooltip={[
            'Este nÃºmero indica quantas cartas de flashcards vocÃª jÃ¡ revisou.',
            'Os flashcards sÃ£o uma tÃ©cnica eficaz de memorizaÃ§Ã£o e revisÃ£o, ajudando vocÃª a consolidar conceitos importantes de forma rÃ¡pida e eficiente.',
          ]}
        />
      </div>

      {/* Linha 2: Consistency Heatmap (largura total) */}
      <ConsistencyHeatmap
        data={data.heatmap}
        period={heatmapPeriod}
        onPeriodChange={handleHeatmapPeriodChange}
      />

      {/* Linha 3: 2 Colunas - Subject Performance List e Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 items-stretch">
        <div className="lg:col-span-3 lg:h-[446px]">
          <SubjectPerformanceList subjects={data.subjects} period={heatmapPeriod} />
        </div>
        <div className="lg:col-span-2 lg:h-[446px]">
          <SubjectDistribution data={data.subjectDistribution} period={heatmapPeriod} />
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

