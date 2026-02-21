'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Trophy,
    RefreshCw,
    Home,
    Sparkles,
    XCircle,
    CircleMinus,
    CircleHelp,
    CircleCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedbackCount = {
    errei: number
    parcial: number
    dificil: number
    facil: number
}

type SessionSummaryProps = {
    feedbacks: number[]
    onFinish: () => void
    onStudyMore: () => void
}

// Mensagens de celebração baseadas no nível de domínio
const CELEBRATION_MESSAGES = {
    excellent: [
        'Incrível! Você está dominando esse conteúdo!',
        'Performance excepcional! Continue assim!',
        'Excelente sessão! Seu esforço está valendo a pena!',
        'Mandou muito bem! Esse conteúdo é seu!',
        'Arrasou! Você está com tudo nesse tema!',
        'Impressionante! Sua dedicação está dando resultado!',
    ],
    good: [
        'Muito bem! Você está no caminho certo!',
        'Bom trabalho! A prática leva à perfeição!',
        'Ótimo progresso! Continue se dedicando!',
        'Você está evoluindo! Só falta consolidar alguns pontos.',
        'Bom desempenho! Mais algumas revisões e você domina tudo.',
        'Parabéns! Você já sabe bastante, falta pouco!',
    ],
    average: [
        'Continue praticando! A constância traz resultados!',
        'Cada revisão te deixa mais preparado!',
        'Não desanime! O aprendizado é um processo!',
        'Você está progredindo! Cada sessão conta.',
        'O caminho é de prática e revisão. Siga firme!',
        'Normal ter dúvidas! A repetição vai fixar o conteúdo.',
    ],
    needsWork: [
        'Foque nos pontos que você errou!',
        'A repetição é a chave do aprendizado!',
        'Revise esses tópicos com mais atenção!',
        'Esse conteúdo precisa de mais revisão. Você consegue!',
        'Não desista! Todo aprendizado começa com dificuldade.',
        'Hora de rever a teoria e voltar mais forte!',
    ],
}

// Conselhos contextuais variados por categoria
const CONTEXTUAL_ADVICE = {
    highInsecurity: [
        'Você acertou bastante, mas revise os temas que te deixaram inseguro.',
        'Muitos acertos com insegurança — uma revisão rápida pode firmar tudo.',
        'Seu conhecimento está lá, só precisa de mais confiança. Revise esses temas!',
    ],
    someInsecurity: [
        'Alguns temas ainda geram insegurança. Continue revisando!',
        'Você está quase lá! Reforce os pontos onde ainda tem dúvida.',
        'Boa base, mas vale repassar os temas onde se sentiu inseguro.',
    ],
    highErrors: [
        'Foque nos flashcards que você errou para solidificar o aprendizado.',
        'Vários erros nessa sessão — reveja a teoria desses tópicos.',
        'Não se preocupe com os erros, eles mostram onde focar seus estudos!',
    ],
    highPartial: [
        'Revise os conceitos onde acertou apenas parcialmente.',
        'Você está no caminho certo, mas precisa completar alguns raciocínios.',
        'Quase lá! Reforce os conteúdos onde o acerto foi parcial.',
    ],
    mixed: [
        'Revise os pontos onde teve dificuldade para consolidar o aprendizado.',
        'Alguns acertos, alguns erros — faz parte! Foque nos gaps.',
        'Boa sessão de diagnóstico! Agora você sabe onde focar.',
    ],
}

export function SessionSummary({ feedbacks, onFinish, onStudyMore }: SessionSummaryProps) {
    const [reducedMotion] = React.useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    // Contar feedbacks
    const counts: FeedbackCount = {
        errei: feedbacks.filter((f) => f === 1).length,
        parcial: feedbacks.filter((f) => f === 2).length,
        dificil: feedbacks.filter((f) => f === 3).length,
        facil: feedbacks.filter((f) => f === 4).length,
    }

    // Score de domínio ponderado:
    // Errei=0, Parcial=0.50, Inseguro=0.75, Acertei=1.0
    // Reflete domínio real: acertar com dúvida pesa menos que acertar com confiança
    const WEIGHTS = { errei: 0, parcial: 0.50, inseguro: 0.75, acertei: 1.0 }

    const total = feedbacks.length
    const corretas = counts.dificil + counts.facil // respostas corretas (binário)
    const weightedSum =
        counts.errei * WEIGHTS.errei +
        counts.parcial * WEIGHTS.parcial +
        counts.dificil * WEIGHTS.inseguro +
        counts.facil * WEIGHTS.acertei
    const score = total > 0 ? Math.round((weightedSum / total) * 100) : 0

    // Get color and message based on weighted score (light/dark aware)
    const getScoreConfig = (s: number) => {
        if (s >= 80) return {
            color: 'text-emerald-600 dark:text-emerald-400',
            ringColor: 'text-emerald-600 dark:text-emerald-400',
            bgGlow: 'rgba(52, 211, 153, 0.15)',
            messages: CELEBRATION_MESSAGES.excellent,
        }
        if (s >= 60) return {
            color: 'text-sky-600 dark:text-sky-400',
            ringColor: 'text-sky-600 dark:text-sky-400',
            bgGlow: 'rgba(56, 189, 248, 0.15)',
            messages: CELEBRATION_MESSAGES.good,
        }
        if (s >= 40) return {
            color: 'text-amber-600 dark:text-amber-400',
            ringColor: 'text-amber-600 dark:text-amber-400',
            bgGlow: 'rgba(251, 191, 36, 0.15)',
            messages: CELEBRATION_MESSAGES.average,
        }
        return {
            color: 'text-red-600 dark:text-red-400',
            ringColor: 'text-red-600 dark:text-red-400',
            bgGlow: 'rgba(248, 113, 113, 0.15)',
            messages: CELEBRATION_MESSAGES.needsWork,
        }
    }

    // Seleciona mensagem variada de um array (determinística por sessão)
    const pickMessage = (messages: string[]) =>
        messages[(score + total + counts.errei) % messages.length]

    // Conselho contextual baseado na distribuição
    const getContextualAdvice = (): string | null => {
        if (total === 0) return null
        const inseguroRatio = counts.dificil / total
        const erreiRatio = counts.errei / total
        const parcialRatio = counts.parcial / total

        if (inseguroRatio >= 0.5) {
            return pickMessage(CONTEXTUAL_ADVICE.highInsecurity)
        }
        if (erreiRatio >= 0.3) {
            return pickMessage(CONTEXTUAL_ADVICE.highErrors)
        }
        if (parcialRatio >= 0.3) {
            return pickMessage(CONTEXTUAL_ADVICE.highPartial)
        }
        if (inseguroRatio >= 0.2) {
            return pickMessage(CONTEXTUAL_ADVICE.someInsecurity)
        }
        if (erreiRatio > 0 || parcialRatio > 0) {
            return pickMessage(CONTEXTUAL_ADVICE.mixed)
        }
        return null
    }

    const scoreConfig = getScoreConfig(score)
    const celebrationMessage =
        scoreConfig.messages[(score + total) % scoreConfig.messages.length]
    const contextualAdvice = getContextualAdvice()

    // Stats data (theme-aware colors)
    const stats = [
        { icon: XCircle, label: 'Errei', subtitle: 'Não sabia', count: counts.errei, color: 'text-foreground', bg: 'bg-red-500/20' },
        { icon: CircleMinus, label: 'Parcial', subtitle: 'Acertei em parte', count: counts.parcial, color: 'text-foreground', bg: 'bg-amber-500/20' },
        { icon: CircleHelp, label: 'Inseguro', subtitle: 'Acertei com dúvida', count: counts.dificil, color: 'text-foreground', bg: 'bg-sky-500/20' },
        { icon: CircleCheck, label: 'Acertei', subtitle: 'Sabia bem', count: counts.facil, color: 'text-foreground', bg: 'bg-emerald-500/20' },
    ]

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden bg-background"
            style={{ backgroundImage: 'none' }}
        >
            {/* Aurora Background - subtle in light, vibrant in dark */}
            <div className="absolute inset-0 pointer-events-none">
                {!reducedMotion && (
                    <>
                        <div className="absolute inset-0 opacity-[0.06] dark:opacity-50 transition-opacity duration-1000">
                            <div
                                className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 animate-aurora-slow"
                                style={{
                                    background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${scoreConfig.bgGlow} 0%, transparent 70%)`
                                }}
                            />
                            <div
                                className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 animate-aurora-medium"
                                style={{
                                    background: 'radial-gradient(ellipse 60% 40% at 60% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)'
                                }}
                            />
                        </div>
                        <div
                            className="absolute inset-0 opacity-[0.015]"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                            }}
                        />
                    </>
                )}
                {reducedMotion && (
                    <div
                        className="absolute inset-0 opacity-[0.04] dark:opacity-100"
                        style={{
                            background: `radial-gradient(ellipse at 50% 50%, ${scoreConfig.bgGlow} 0%, transparent 70%)`
                        }}
                    />
                )}
            </div>

            {/* Main content */}
            <div className="h-full w-full flex flex-col items-center justify-center px-4 md:px-6 relative z-10 overflow-y-auto py-6 md:py-8">
                <div className="w-full max-w-lg space-y-5 md:space-y-6 my-auto">
                    {/* Trophy and Score Ring */}
                    <div className="flex flex-col items-center">
                        {/* Trophy icon */}
                        <div className="relative mb-3 md:mb-4">
                            <div className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full',
                                'bg-primary border border-primary/30',
                                'shadow-lg'
                            )}>
                                <Trophy className="h-6 w-6 text-primary-foreground" />
                            </div>
                            {score >= 80 && (
                                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-foreground animate-pulse" />
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="section-title mb-1">
                            Sessão Concluída!
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-6">
                            Você revisou {total} flashcards
                        </p>

                        {/* Score Ring */}
                        <div className="relative">
                            <svg width="120" height="120" className="-rotate-90 md:w-35 md:h-35">
                                <defs>
                                    <filter id="glow-summary" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="48"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-muted-foreground/20 dark:text-white/10 md:[cx:70] md:[cy:70] md:[r:55]"
                                />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="48"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    filter="url(#glow-summary)"
                                    className={cn('transition-[stroke-dashoffset] duration-1000 motion-reduce:transition-none md:[cx:70] md:[cy:70] md:[r:55]', scoreConfig.ringColor)}
                                    strokeDasharray={2 * Math.PI * 48}
                                    strokeDashoffset={(2 * Math.PI * 48) - ((score / 100) * 2 * Math.PI * 48)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={cn('metric-value tabular-nums', scoreConfig.color)}>
                                    {score}%
                                </span>
                                <span className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">domínio</span>
                            </div>
                        </div>

                        {/* Celebration message + contextual advice */}
                        <p className={cn('mt-3 md:mt-4 text-sm md:text-base text-center font-medium', scoreConfig.color)}>
                            {celebrationMessage}
                        </p>
                        {contextualAdvice && (
                            <p className="mt-1.5 text-xs md:text-sm text-center text-muted-foreground">
                                {contextualAdvice}
                            </p>
                        )}

                        {/* Explanation of "domínio" */}
                        <p className="mt-3 text-[10px] md:text-xs text-center text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                            O domínio considera seus acertos, erros, acertos parciais e sua confiança em cada resposta.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className={cn(
                                    'flex flex-col items-center gap-1 md:gap-1.5 py-2.5 md:py-3 px-1.5 md:px-2 rounded-xl',
                                    'bg-muted/50 dark:bg-white/5 border border-border dark:border-white/10'
                                )}
                            >
                                <div className={cn('p-1 md:p-1.5 rounded-lg', stat.bg)}>
                                    <stat.icon className={cn('h-3 w-3 md:h-3.5 md:w-3.5', stat.color)} />
                                </div>
                                <span className="metric-value tabular-nums">
                                    {stat.count}
                                </span>
                                <span className="text-[9px] md:text-xs text-muted-foreground leading-tight text-center">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Distribution bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Distribuição</span>
                            <span>{corretas} de {total} corretas</span>
                        </div>
                        <div className="h-2 md:h-2.5 rounded-full overflow-hidden bg-muted dark:bg-white/10 flex">
                            {counts.errei > 0 && (
                                <div
                                    className="h-full bg-red-500 transition-[width] duration-500 motion-reduce:transition-none"
                                    style={{ width: `${(counts.errei / total) * 100}%` }}
                                />
                            )}
                            {counts.parcial > 0 && (
                                <div
                                    className="h-full bg-amber-500 transition-[width] duration-500 motion-reduce:transition-none"
                                    style={{ width: `${(counts.parcial / total) * 100}%` }}
                                />
                            )}
                            {counts.dificil > 0 && (
                                <div
                                    className="h-full bg-sky-500 transition-[width] duration-500 motion-reduce:transition-none"
                                    style={{ width: `${(counts.dificil / total) * 100}%` }}
                                />
                            )}
                            {counts.facil > 0 && (
                                <div
                                    className="h-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
                                    style={{ width: `${(counts.facil / total) * 100}%` }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 pb-4">
                        <Button
                            onClick={onFinish}
                            className={cn(
                                'flex-1 h-11 md:h-12 text-sm md:text-base font-medium',
                                'bg-primary hover:bg-primary/90 text-primary-foreground',
                                'transition-colors duration-200 motion-reduce:transition-none',
                                'shadow-lg'
                            )}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Concluir
                        </Button>
                        <Button
                            onClick={onStudyMore}
                            variant="outline"
                            className={cn(
                                'flex-1 h-11 md:h-12 text-sm md:text-base font-medium',
                                'bg-muted/50 dark:bg-white/5 border-border dark:border-white/20 text-foreground',
                                'hover:bg-muted dark:hover:bg-white/10 hover:border-border dark:hover:border-white/30',
                                'transition-colors duration-200 motion-reduce:transition-none'
                            )}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Estudar +10
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
