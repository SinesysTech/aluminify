'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Brain, RefreshCw, AlertCircle, Target } from 'lucide-react'
import type { DashboardData, DashboardPeriod } from '../../types'
import {
    fetchDashboardData,
    type DashboardServiceError,
} from '../../services/aluno/dashboard.service'
import { DashboardHeader } from './dashboard-header'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import { ScheduleProgress } from './schedule-progress'
import { MetricCard } from './metric-card'
import {
    ConsistencyHeatmap,
    type HeatmapPeriod,
} from './consistency-heatmap'
import { SubjectPerformanceList } from './subject-performance-list'
import { FocusEfficiencyChart } from './focus-efficiency-chart'
import { SubjectDistribution } from './subject-distribution'
import { StrategicDomain } from './strategic-domain'
import { DashboardSkeleton } from './dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/app/shared/components/feedback/alert'

/**
 * Converte HeatmapPeriod para DashboardPeriod
 * A API só aceita 'semanal', 'mensal' ou 'anual'
 * Mapeia: semestral -> anual
 */
function mapHeatmapPeriodToDashboardPeriod(
    period: HeatmapPeriod
): DashboardPeriod {
    switch (period) {
        case 'mensal':
            return 'mensal'
        case 'semestral':
            return 'anual' // Mapeia semestral para anual (mais próximo)
        case 'anual':
            return 'anual'
        default:
            return 'anual' // Fallback
    }
}

// Intervalo de refresh automático (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

export default function StudentDashboardClientPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAuthError, setIsAuthError] = useState(false)
    const [, setIsRefreshing] = useState(false)
    const [, setLastRefresh] = useState<Date | null>(null)
    const [heatmapPeriod, setHeatmapPeriod] = useState<HeatmapPeriod>('anual')
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const router = useRouter()
    const params = useParams<{ tenant?: string | string[] }>()
    const tenant =
        typeof params?.tenant === 'string'
            ? params.tenant
            : Array.isArray(params?.tenant)
                ? params?.tenant[0]
                : undefined
    const loginUrl = tenant ? `/${tenant}/auth/login` : '/auth/login'

    // Get active organization for filtering (multi-org students)
    const { activeOrganization } = useStudentOrganizations()
    const activeOrgId = activeOrganization?.id ?? undefined

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

                // Pass empresaId to filter data by organization (for multi-org students)
                const dashboardData = await fetchDashboardData({
                    period: periodToUse,
                    empresaId: activeOrgId,
                })
                setData(dashboardData)
                setLastRefresh(new Date())
            } catch (err) {
                const serviceErr = err as DashboardServiceError
                // Evitar console.error em erros esperados (401/403 etc),
                // porque o dev overlay do Next trata como "Console Error".
                if (serviceErr?.isAuthError || serviceErr?.isNetworkError) {
                    console.warn('Erro esperado ao carregar dados do dashboard:', err)
                } else {
                    console.error('Erro ao carregar dados do dashboard:', err)
                }

                let errorMessage = 'Erro ao carregar dados do dashboard'
                if (err instanceof Error) {
                    errorMessage = err.message

                    // Tratamento específico para erros de autenticação
                    if ((err as DashboardServiceError).isAuthError) {
                        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.'
                        setIsAuthError(true)
                    } else if ((err as DashboardServiceError).isNetworkError) {
                        errorMessage =
                            'Erro de conexão. Verifique sua internet e tente novamente.'
                        setIsAuthError(false)
                    } else {
                        setIsAuthError(false)
                    }
                } else {
                    setIsAuthError(false)
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
        },
        [heatmapPeriod, activeOrgId]
    )

    // Carregamento inicial
    useEffect(() => {
        loadDashboardData()
    }, [loadDashboardData])

    // Handler para mudança de período do heatmap
    const handleHeatmapPeriodChange = useCallback(
        (period: HeatmapPeriod) => {
            setHeatmapPeriod(period)
            loadDashboardData(true, period)
        },
        [loadDashboardData]
    )

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
        let channel:
            | ReturnType<
                ReturnType<typeof import('@/app/shared/core/client').createClient>['channel']
            >
            | null = null
        let supabaseInstance:
            | ReturnType<typeof import('@/app/shared/core/client').createClient>
            | null = null

        async function setupRealtimeSubscription() {
            const { createClient } = await import('@/app/shared/core/client')
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
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle<{ id: string }>()

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
                    (payload: {
                        new: Record<string, unknown>
                        old: Record<string, unknown>
                        eventType: string
                    }) => {
                        console.log(
                            '[Dashboard Realtime] Mudança detectada em cronograma_itens:',
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
                        {isAuthError && (
                            <Button
                                onClick={() => router.push(loginUrl)}
                                variant="default"
                                size="sm"
                                className="mt-4 mr-2"
                            >
                                Ir para login
                            </Button>
                        )}
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
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
            {/* Topo: Header */}
            <DashboardHeader user={data.user} />

            {/* Mensagem de erro (se houver dados mas também erro) */}
            {error && data && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aviso</AlertTitle>
                    <AlertDescription>{error}. Dados podem estar desatualizados.</AlertDescription>
                </Alert>
            )}

            {/* Progresso do Cronograma */}
            <ScheduleProgress value={data.metrics.scheduleProgress} />

            {/* Grid de 4 Metric Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
                <MetricCard
                    label="Tempo de Estudo"
                    value={data.metrics.focusTime}
                    icon={Clock}
                    variant="time"
                    trend={{
                        value: data.metrics.focusTimeDelta,
                        isPositive: data.metrics.focusTimeDelta.startsWith('+'),
                    }}
                    tooltip={[
                        'Tempo total de estudo no período, somando aulas assistidas e sessões de exercícios.',
                        'O valor mostra a diferença em relação ao período anterior.',
                    ]}
                />
                <MetricCard
                    label="Questões Feitas"
                    value={data.metrics.questionsAnswered}
                    subtext={data.metrics.questionsAnsweredPeriod}
                    icon={CheckCircle2}
                    variant="questions"
                    tooltip={[
                        'Total de questões resolvidas no período.',
                        'Resolver questões é fundamental para fixar o conteúdo!',
                    ]}
                />
                <MetricCard
                    label="Aproveitamento"
                    value={`${data.metrics.accuracy}%`}
                    icon={Target}
                    variant="accuracy"
                    showProgressCircle={true}
                    progressValue={data.metrics.accuracy}
                    tooltip={[
                        'Porcentagem de acertos nas questões resolvidas.',
                        'Quanto maior, melhor você está dominando o conteúdo.',
                    ]}
                />
                <MetricCard
                    label="Flashcards"
                    value={data.metrics.flashcardsReviewed}
                    subtext="Cartas revisadas"
                    icon={Brain}
                    variant="flashcards"
                    tooltip={[
                        'Cartas de flashcards revisadas.',
                        'Técnica eficaz para memorização e revisão rápida!',
                    ]}
                />
            </div>

            {/* Consistency Heatmap (largura total) */}
            <ConsistencyHeatmap
                data={data.heatmap}
                period={heatmapPeriod}
                onPeriodChange={handleHeatmapPeriodChange}
            />

            {/* 2 Colunas - Subject Performance List e Subject Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 items-stretch">
                <div className="lg:col-span-3 lg:h-111.5">
                    <SubjectPerformanceList subjects={data.subjects} period={mapHeatmapPeriodToDashboardPeriod(heatmapPeriod)} />
                </div>
                <div className="lg:col-span-2 lg:h-111.5">
                    <SubjectDistribution data={data.subjectDistribution} period={mapHeatmapPeriodToDashboardPeriod(heatmapPeriod)} />
                </div>
            </div>

            {/* 2 Colunas - Focus Efficiency Chart e Strategic Domain */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <FocusEfficiencyChart data={data.focusEfficiency} />
                <StrategicDomain data={data.strategicDomain} />
            </div>
        </div>
    )
}
