'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Trophy,
    RefreshCw,
    Home,
    Sparkles,
    XCircle,
    CircleDot,
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

// Mensagens de celebração baseadas no score
const CELEBRATION_MESSAGES = {
    excellent: [
        'Incrível! Você está dominando esse conteúdo!',
        'Performance excepcional! Continue assim!',
        'Excelente sessão! Seu esforço está valendo a pena!',
    ],
    good: [
        'Muito bem! Você está no caminho certo!',
        'Bom trabalho! A prática leva à perfeição!',
        'Ótimo progresso! Continue se dedicando!',
    ],
    average: [
        'Continue praticando! A constância traz resultados!',
        'Cada revisão te deixa mais preparado!',
        'Não desanime! O aprendizado é um processo!',
    ],
    needsWork: [
        'Foque nos pontos que você errou!',
        'A repetição é a chave do aprendizado!',
        'Revise esses tópicos com mais atenção!',
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

    // Calcular score: (Bom + Fácil) / Total
    const total = feedbacks.length
    const acertos = counts.dificil + counts.facil
    const score = total > 0 ? Math.round((acertos / total) * 100) : 0

    // Progress ring calculations
    const circumference = 2 * Math.PI * 70
    const strokeDashoffset = circumference - ((score / 100) * circumference)

    // Get color and message based on score
    const getScoreConfig = (score: number) => {
        if (score >= 80) return {
            color: 'text-emerald-400',
            ringColor: 'text-emerald-400',
            bgGlow: 'rgba(52, 211, 153, 0.15)',
            messages: CELEBRATION_MESSAGES.excellent,
        }
        if (score >= 60) return {
            color: 'text-sky-400',
            ringColor: 'text-sky-400',
            bgGlow: 'rgba(56, 189, 248, 0.15)',
            messages: CELEBRATION_MESSAGES.good,
        }
        if (score >= 40) return {
            color: 'text-amber-400',
            ringColor: 'text-amber-400',
            bgGlow: 'rgba(251, 191, 36, 0.15)',
            messages: CELEBRATION_MESSAGES.average,
        }
        return {
            color: 'text-red-400',
            ringColor: 'text-red-400',
            bgGlow: 'rgba(248, 113, 113, 0.15)',
            messages: CELEBRATION_MESSAGES.needsWork,
        }
    }

    const scoreConfig = getScoreConfig(score)
    const celebrationMessage = scoreConfig.messages[Math.floor(Math.random() * scoreConfig.messages.length)]

    // Stats data
    const stats = [
        { icon: XCircle, label: 'Errei', count: counts.errei, color: 'text-red-400', bg: 'bg-red-500/20' },
        { icon: CircleDot, label: 'Parcial', count: counts.parcial, color: 'text-amber-400', bg: 'bg-amber-500/20' },
        { icon: CircleHelp, label: 'Inseguro', count: counts.dificil, color: 'text-sky-400', bg: 'bg-sky-500/20' },
        { icon: CircleCheck, label: 'Acertei', count: counts.facil, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    ]

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Aurora Background */}
            <div className="absolute inset-0 bg-slate-950 pointer-events-none">
                {!reducedMotion && (
                    <>
                        <div className="absolute inset-0 opacity-50 transition-opacity duration-1000">
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
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at 50% 50%, ${scoreConfig.bgGlow} 0%, transparent 70%)`
                        }}
                    />
                )}
            </div>

            {/* Main content */}
            <div className="h-full w-full flex flex-col items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-lg space-y-8">
                    {/* Trophy and Score Ring */}
                    <div className="flex flex-col items-center">
                        {/* Trophy icon */}
                        <div className="relative mb-6">
                            <div className={cn(
                                'flex h-16 w-16 items-center justify-center rounded-full',
                                'bg-amber-500/20 border border-amber-500/30'
                            )}>
                                <Trophy className="h-8 w-8 text-amber-400" />
                            </div>
                            {score >= 80 && (
                                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 animate-pulse" />
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Sessão Concluída!
                        </h1>
                        <p className="text-slate-400 text-sm mb-8">
                            Você revisou {total} flashcards
                        </p>

                        {/* Score Ring */}
                        <div className="relative">
                            <svg width="180" height="180" className="-rotate-90">
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
                                    cx="90"
                                    cy="90"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="90"
                                    cy="90"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    filter="url(#glow-summary)"
                                    className={cn('transition-all duration-1000', scoreConfig.ringColor)}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={cn('text-5xl font-bold tabular-nums', scoreConfig.color)}>
                                    {score}%
                                </span>
                                <span className="text-xs text-slate-400 mt-1">score</span>
                            </div>
                        </div>

                        {/* Celebration message */}
                        <p className={cn('mt-6 text-center font-medium', scoreConfig.color)}>
                            {celebrationMessage}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className={cn(
                                    'flex flex-col items-center gap-2 py-4 px-2 rounded-xl',
                                    'bg-white/5 border border-white/10'
                                )}
                            >
                                <div className={cn('p-2 rounded-lg', stat.bg)}>
                                    <stat.icon className={cn('h-4 w-4', stat.color)} />
                                </div>
                                <span className="text-2xl font-bold text-white tabular-nums">
                                    {stat.count}
                                </span>
                                <span className="text-xs text-slate-400">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Distribution bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Distribuição</span>
                            <span>{acertos} de {total} acertos</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden bg-white/10 flex">
                            {counts.errei > 0 && (
                                <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${(counts.errei / total) * 100}%` }}
                                />
                            )}
                            {counts.parcial > 0 && (
                                <div
                                    className="h-full bg-amber-500 transition-all duration-500"
                                    style={{ width: `${(counts.parcial / total) * 100}%` }}
                                />
                            )}
                            {counts.dificil > 0 && (
                                <div
                                    className="h-full bg-sky-500 transition-all duration-500"
                                    style={{ width: `${(counts.dificil / total) * 100}%` }}
                                />
                            )}
                            {counts.facil > 0 && (
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(counts.facil / total) * 100}%` }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            onClick={onFinish}
                            className={cn(
                                'flex-1 h-12 text-base font-medium',
                                'bg-violet-600 hover:bg-violet-500 text-white',
                                'transition-all duration-300 hover:scale-[1.02]',
                                'shadow-lg shadow-violet-500/25'
                            )}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Concluir
                        </Button>
                        <Button
                            onClick={onStudyMore}
                            variant="outline"
                            className={cn(
                                'flex-1 h-12 text-base font-medium',
                                'bg-white/5 border-white/20 text-white',
                                'hover:bg-white/10 hover:border-white/30',
                                'transition-all duration-300 hover:scale-[1.02]'
                            )}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Estudar +10
                        </Button>
                    </div>
                </div>
            </div>

            {/* CSS for aurora animations */}
            <style jsx>{`
                @keyframes aurora-slow {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    25% { transform: translate(5%, 5%) rotate(5deg); }
                    50% { transform: translate(0%, 10%) rotate(0deg); }
                    75% { transform: translate(-5%, 5%) rotate(-5deg); }
                }
                @keyframes aurora-medium {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    33% { transform: translate(-8%, 8%) rotate(-8deg); }
                    66% { transform: translate(8%, -4%) rotate(8deg); }
                }
                .animate-aurora-slow {
                    animation: aurora-slow 30s ease-in-out infinite;
                }
                .animate-aurora-medium {
                    animation: aurora-medium 20s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
