'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/app/shared/components/feedback/progress'
import {
    BookOpen,
    Clock,
    PlayCircle,
    CheckCircle2,
    Trophy,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AtividadeComProgresso } from '../types'
import type { LucideIcon } from 'lucide-react'

interface LibraryStatsProps {
    atividades: AtividadeComProgresso[]
    totalGeral?: number
    hasFilters?: boolean
    contexto?: {
        curso?: string | null
        disciplina?: string | null
        frente?: string | null
    }
}

function getMotivationalMessage(percentual: number): string {
    if (percentual === 0) return 'Comece sua jornada de estudos!'
    if (percentual < 25) return 'Cada passo conta! Continue avançando.'
    if (percentual < 50) return 'Você está progredindo bem!'
    if (percentual < 75) return 'Mais da metade concluída! Continue firme!'
    if (percentual < 100) return 'Quase lá, não desista!'
    return 'Todas as atividades concluídas!'
}

// --- Inline StatCard (matching MetricCard pattern from dashboard) ---

type StatVariant = 'default' | 'pending' | 'progress' | 'completed'

const statVariantConfig: Record<
    StatVariant,
    { gradient: string; iconBg: string; iconColor: string; valueColor: string }
> = {
    default: {
        gradient: 'from-primary/5 to-transparent',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        valueColor: 'text-foreground',
    },
    pending: {
        gradient: 'from-amber-500/8 to-transparent',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        valueColor: 'text-amber-600 dark:text-amber-400',
    },
    progress: {
        gradient: 'from-blue-500/8 to-transparent',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400',
        valueColor: 'text-blue-600 dark:text-blue-400',
    },
    completed: {
        gradient: 'from-emerald-500/8 to-transparent',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
}

function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
}: {
    label: string
    value: number
    icon: LucideIcon
    variant?: StatVariant
}) {
    const config = statVariantConfig[variant]

    return (
        <Card className="group relative overflow-hidden transition-colors duration-200 motion-reduce:transition-none hover:shadow-md">
            <div
                className={cn(
                    'absolute inset-0 bg-linear-to-br opacity-60 transition-opacity group-hover:opacity-100',
                    config.gradient,
                )}
            />
            <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <div
                        className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200 motion-reduce:transition-none',
                            config.iconBg,
                        )}
                    >
                        <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
                    </div>
                </div>
                <span className={cn('metric-value', config.valueColor)}>
                    {value}
                </span>
            </CardContent>
        </Card>
    )
}

// --- Main Component ---

export function LibraryStats({
    atividades,
    totalGeral,
    hasFilters = false,
    contexto,
}: LibraryStatsProps) {
    const stats = React.useMemo(() => {
        const total = atividades.length
        const pendentes = atividades.filter(
            (a) => !a.progressoStatus || a.progressoStatus === 'Pendente',
        ).length
        const iniciadas = atividades.filter((a) => a.progressoStatus === 'Iniciado').length
        const concluidas = atividades.filter((a) => a.progressoStatus === 'Concluido').length
        const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

        return { total, pendentes, iniciadas, concluidas, percentual }
    }, [atividades])

    const isComplete = stats.percentual >= 100 && stats.total > 0

    return (
        <div className="space-y-4">
            {/* Progress Banner */}
            <Card
                className={cn(
                    'overflow-hidden',
                    isComplete && 'border-emerald-500/30',
                )}
            >
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                            className={cn(
                                'flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl shrink-0',
                                isComplete ? 'bg-emerald-500/15' : 'bg-primary/10',
                            )}
                        >
                            {isComplete ? (
                                <Trophy className="h-6 w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header Row */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-semibold text-sm md:text-base truncate">
                                        Progresso Geral
                                    </span>
                                    {isComplete && (
                                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                                    )}
                                    {hasFilters && totalGeral !== undefined && totalGeral !== stats.total && (
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            ({stats.total} de {totalGeral} atividades)
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-sm md:text-base font-bold shrink-0',
                                        isComplete
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-foreground',
                                    )}
                                >
                                    {stats.percentual}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <Progress
                                value={stats.percentual}
                                className={cn(
                                    'h-2.5 md:h-3',
                                    isComplete && '[&>div]:bg-emerald-500',
                                )}
                            />

                            {/* Motivational Message + Context */}
                            <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    {getMotivationalMessage(stats.percentual)}
                                </p>
                                {contexto &&
                                    (contexto.curso ||
                                        contexto.disciplina ||
                                        contexto.frente) && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {contexto.curso && (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] bg-muted/50 text-muted-foreground">
                                                    {contexto.curso}
                                                </span>
                                            )}
                                            {contexto.disciplina && (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] bg-muted/50 text-muted-foreground">
                                                    {contexto.disciplina}
                                                </span>
                                            )}
                                            {contexto.frente && (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] bg-muted/50 text-muted-foreground">
                                                    {contexto.frente}
                                                </span>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Total de Atividades"
                    value={stats.total}
                    icon={BookOpen}
                    variant="default"
                />
                <StatCard
                    label="Pendentes"
                    value={stats.pendentes}
                    icon={Clock}
                    variant="pending"
                />
                <StatCard
                    label="Em Progresso"
                    value={stats.iniciadas}
                    icon={PlayCircle}
                    variant="progress"
                />
                <StatCard
                    label="Concluídas"
                    value={stats.concluidas}
                    icon={CheckCircle2}
                    variant="completed"
                />
            </div>
        </div>
    )
}
