'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Clock, CheckCircle2, Brain, RefreshCw, AlertCircle } from 'lucide-react'
import type {
    UserInfo,
    DashboardPeriod,
    Metrics,
    HeatmapDay,
    SubjectPerformance,
    FocusEfficiencyDay,
    SubjectDistributionItem
} from './types'
import {
    fetchDashboardUser,
    fetchDashboardMetrics,
    fetchDashboardHeatmap,
    fetchDashboardSubjects,
    fetchDashboardEfficiency,
    fetchDashboardStrategic,
    fetchDashboardDistribution,
    type DashboardServiceError,
} from './services/dashboard.service'
import { DashboardHeader } from '@/app/[tenant]/(modules)/dashboard/components/dashboard-header'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import { useOptionalTenantContext } from '@/app/[tenant]/tenant-context'
import { ScheduleProgress } from './components/schedule-progress'
import { MetricCard } from './components/metric-card'
import {
    ConsistencyHeatmap,
    type HeatmapPeriod,
} from './components/consistency-heatmap'
import { SubjectPerformanceList } from './components/subject-performance-list'
import { FocusEfficiencyChart } from './components/focus-efficiency-chart'
import { SubjectDistribution } from './components/subject-distribution'
import type { StrategicDomain as StrategicDomainType } from './types'
import { StrategicDomain } from './components/strategic-domain'
import { DashboardSkeleton } from '@/app/[tenant]/(modules)/dashboard/components/dashboard-skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/app/shared/components/feedback/alert'

// Intervalo de refresh automático (5 minutos)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

function mapHeatmapPeriod(period: HeatmapPeriod): DashboardPeriod {
    return period
}

export default function StudentDashboardClientPage() {
    // Individual states for granular data
    const [user, setUser] = useState<UserInfo | null>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
    const [efficiency, setEfficiency] = useState<FocusEfficiencyDay[]>([]);
    const [strategic, setStrategic] = useState<StrategicDomainType | null>(null)
    const [distribution, setDistribution] = useState<SubjectDistributionItem[]>([]);

    const [isLoadingUser, setIsLoadingUser] = useState(true)
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
    // We can track other loading states if we want detailed skeletons, 
    // but for now we'll stick to a main loading state for the critical top part or a combined approach.

    // Derived loading state for the main view
    const isInitialLoading = isLoadingUser || isLoadingMetrics;

    const [error, setError] = useState<string | null>(null)
    const [, setIsRefreshing] = useState(false)
    const [, setLastRefresh] = useState<Date | null>(null)
    const [heatmapPeriod, setHeatmapPeriod] = useState<HeatmapPeriod>('anual')
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Tenant da URL é a fonte de verdade; activeOrganization pode estar desatualizado (localStorage)
    const tenantContext = useOptionalTenantContext()
    const { activeOrganization } = useStudentOrganizations()
    const activeOrgId =
        tenantContext?.empresaId ?? activeOrganization?.id ?? undefined

    // Helper to handle errors uniformly
    const handleError = (err: unknown, context: string) => {
        console.error(`Erro ao carregar ${context}:`, err)
        let errorMessage = `Erro ao carregar ${context}`
        if (err instanceof Error) {
            errorMessage = err.message
            if ((err as DashboardServiceError).isAuthError) {
                return 'Sua sessão expirou. Por favor, faça login novamente.'
            }
        }
        return errorMessage
    }

    const loadData = useCallback(
        async (showRefreshing = false, period?: HeatmapPeriod) => {
            const periodToUse = period ?? heatmapPeriod
            if (showRefreshing) setIsRefreshing(true)

            setError(null)

            try {
                // Determine what needs to be fetched
                // If fetching everything (initial or refresh), fetch User too.
                // If just changing period, usually User info doesn't change based on period, 
                // but we might want to refresh it if it's a "refresh" action.

                const promises = []

                // 1. User Info (only on initial load or full refresh, not period change)
                if (!user || showRefreshing) {
                    setIsLoadingUser(true)
                    promises.push(
                        fetchDashboardUser(activeOrgId)
                            .then(setUser)
                            .catch(e => {
                                const msg = handleError(e, 'usuário')
                                if (typeof msg === 'string' && msg.includes('sessão')) setError(msg)
                            })
                            .finally(() => setIsLoadingUser(false))
                    )
                } else {
                    setIsLoadingUser(false)
                }

                // 2. Metrics (Dependent on period)
                setIsLoadingMetrics(true)
                promises.push(
                    fetchDashboardMetrics(mapHeatmapPeriod(periodToUse), activeOrgId)
                        .then(setMetrics)
                        .catch(e => setError(handleError(e, 'métricas')))
                        .finally(() => setIsLoadingMetrics(false))
                )

                // 3. Heatmap
                promises.push(
                    fetchDashboardHeatmap(periodToUse, activeOrgId)
                        .then(setHeatmap)
                        .catch(e => console.warn(handleError(e, 'heatmap')))
                )

                // 4. Subjects
                promises.push(
                    fetchDashboardSubjects(mapHeatmapPeriod(periodToUse), activeOrgId)
                        .then(setSubjects)
                        .catch(e => console.warn(handleError(e, 'disciplinas')))
                )

                // 5. Efficiency
                promises.push(
                    fetchDashboardEfficiency(mapHeatmapPeriod(periodToUse), activeOrgId)
                        .then(setEfficiency)
                        .catch(e => console.warn(handleError(e, 'eficiência')))
                )

                // 6. Strategic
                promises.push(
                    fetchDashboardStrategic(mapHeatmapPeriod(periodToUse), activeOrgId)
                        .then(setStrategic)
                        .catch(e => console.warn(handleError(e, 'domínio estratégico')))
                )

                // 7. Distribution
                promises.push(
                    fetchDashboardDistribution(mapHeatmapPeriod(periodToUse), activeOrgId)
                        .then(setDistribution)
                        .catch(e => console.warn(handleError(e, 'distribuição')))
                )

                await Promise.all(promises)
                setLastRefresh(new Date())

            } catch (err) {
                // Fallback global error handler
                const msg = handleError(err, 'dados')
                setError(msg)
            } finally {
                setIsRefreshing(false)
            }
        },
        [heatmapPeriod, activeOrgId, user]
    )

    // Carregamento inicial
    useEffect(() => {
        loadData()
    }, [activeOrgId, loadData]) // Dependency on activeOrgId ensures reload on tenant switch

    // Handler para mudança de período do heatmap
    const handleHeatmapPeriodChange = useCallback(
        (period: HeatmapPeriod) => {
            setHeatmapPeriod(period)
            loadData(true, period)
        },
        [loadData]
    )

    // Refresh automático
    useEffect(() => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = setInterval(() => {
            loadData(true)
        }, AUTO_REFRESH_INTERVAL)
        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
        }
    }, [loadData])

    // Subscription Realtime
    useEffect(() => {
        let channel: ReturnType<ReturnType<typeof import('@/app/shared/core/client').createClient>['channel']> | null = null
        let supabaseInstance: ReturnType<typeof import('@/app/shared/core/client').createClient> | null = null

        async function setupRealtimeSubscription() {
            const { createClient } = await import('@/app/shared/core/client')
            supabaseInstance = createClient()
            const { data: { user } } = await supabaseInstance.auth.getUser()
            if (!user) return

            const { data: cronograma } = await supabaseInstance
                .from('cronogramas')
                .select('id')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle<{ id: string }>()

            if (!cronograma) return

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
                    () => loadData(true)
                )
                .subscribe()
        }

        setupRealtimeSubscription()

        return () => {
            if (channel && supabaseInstance) {
                supabaseInstance.removeChannel(channel)
            }
        }
    }, [loadData])

    const handleManualRefresh = () => {
        loadData(true)
    }

    if (isInitialLoading) {
        return <DashboardSkeleton />
    }

    if (error && !user) {
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

    if (!user || !metrics) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <p className="text-muted-foreground">Nenhum dado disponível</p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl">
            {/* Topo: Header e Schedule Progress */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <DashboardHeader user={user} />
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aviso</AlertTitle>
                    <AlertDescription>{error}. Dados podem estar desatualizados.</AlertDescription>
                </Alert>
            )}

            <ScheduleProgress value={metrics.scheduleProgress} />

            {/* Linha 1: Grid de 4 Metric Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <MetricCard
                    label="Tempo de Estudo"
                    value={metrics.focusTime}
                    icon={Clock}
                    trend={{
                        value: metrics.focusTimeDelta,
                        isPositive: metrics.focusTimeDelta.startsWith('+'),
                    }}
                    tooltip={[
                        'Este é o tempo total de estudo no período, somando aulas que você marcou como assistidas no cronograma e o tempo registrado em listas de exercícios (sessões vinculadas a uma atividade).',
                        'O valor mostra a diferença em relação ao período anterior, ajudando você a acompanhar sua evolução.',
                    ]}
                />
                <MetricCard
                    label="Questões Feitas"
                    value={metrics.questionsAnswered}
                    subtext={metrics.questionsAnsweredPeriod}
                    icon={CheckCircle2}
                    tooltip={[
                        'Este número representa a quantidade total de questões que você já resolveu no período indicado.',
                        'Resolver questões é fundamental para fixar o conteúdo e se preparar melhor para as provas.',
                    ]}
                />
                <MetricCard
                    label="Aproveitamento"
                    value={`${metrics.accuracy}%`}
                    showProgressCircle={true}
                    progressValue={metrics.accuracy}
                    tooltip={[
                        'Seu aproveitamento mostra a porcentagem de acertos nas questões que você resolveu.',
                        'Quanto maior o percentual, melhor você está dominando o conteúdo.',
                        'Este indicador ajuda a identificar áreas que precisam de mais estudo.',
                    ]}
                />
                <MetricCard
                    label="Flashcards"
                    value={metrics.flashcardsReviewed}
                    subtext="Cartas revisadas"
                    icon={Brain}
                    tooltip={[
                        'Este número indica quantas cartas de flashcards você já revisou.',
                        'Os flashcards são uma técnica eficaz de memorização e revisão, ajudando você a consolidar conceitos importantes de forma rápida e eficiente.',
                    ]}
                />
            </div>

            {/* Linha 2: Consistency Heatmap (largura total) */}
            <ConsistencyHeatmap
                data={heatmap}
                period={heatmapPeriod}
                onPeriodChange={handleHeatmapPeriodChange}
            />

            {/* Linha 3: 2 Colunas - Subject Performance List e Subject Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 items-stretch">
                <div className="lg:col-span-3 lg:h-111.5">
                    <SubjectPerformanceList subjects={subjects} period={heatmapPeriod} />
                </div>
                <div className="lg:col-span-2 lg:h-111.5">
                    <SubjectDistribution data={distribution} period={heatmapPeriod} />
                </div>
            </div>

            {/* Linha 4: 2 Colunas - Focus Efficiency Chart e Strategic Domain */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FocusEfficiencyChart data={efficiency} />
                {strategic && <StrategicDomain data={strategic} />}
            </div>
        </div>
    )
}
