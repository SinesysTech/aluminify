'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Play, X, Maximize, Minimize, Coffee, Brain } from 'lucide-react'
import { StudyTimerState } from '@/hooks/use-study-timer'
import { cn } from '@/lib/utils'

interface CleanViewProps {
    elapsedLabel: string
    remainingLabel: string
    metodo: string
    isFullscreen: boolean
    onToggleFullscreen: () => void
    fullscreenError: string | null
    state: StudyTimerState
    onPause: () => void
    onResume: () => void
    onShowFinalizeModal: () => void
    pomodoroPhase?: 'focus' | 'short_break' | 'long_break'
    pomodoroCycle?: number
    totalCycles?: number
}

// Frases de autores famosos sobre foco e concentração
const MOTIVATIONAL_QUOTES = [
    { text: 'Concentre todos os seus pensamentos no trabalho. Os raios do sol só queimam quando focados.', author: 'Alexander Graham Bell' },
    { text: 'Não viva no passado, não sonhe com o futuro. Concentre a mente no momento presente.', author: 'Buda' },
    { text: 'Não importa o quão lentamente você vai, desde que não pare.', author: 'Confúcio' },
    { text: 'Somos o que fazemos repetidamente. A excelência não é um ato, mas um hábito.', author: 'Aristóteles' },
    { text: 'Foco não significa dizer sim. Significa dizer não.', author: 'Steve Jobs' },
    { text: 'A capacidade de concentrar e usar bem o tempo é tudo.', author: 'Lee Iacocca' },
    { text: 'Eu temo não o homem que praticou 10.000 chutes uma vez, mas o que praticou um chute 10.000 vezes.', author: 'Bruce Lee' },
    { text: 'Concentração é meu lema — primeiro honestidade, depois trabalho, depois concentração.', author: 'Andrew Carnegie' },
    { text: 'Concentração é uma das coisas mais felizes da minha vida.', author: 'Haruki Murakami' },
    { text: 'Você nunca chegará ao seu destino se parar para atirar pedras em cada cachorro que ladrar.', author: 'Winston Churchill' },
    { text: 'O sucesso nasce do querer, da determinação e persistência em chegar a um objetivo.', author: 'José de Alencar' },
    { text: 'Se você quer ser bem-sucedido, precisa de dedicação total e dar o melhor de si.', author: 'Ayrton Senna' },
    { text: 'Mantenha os olhos abertos, concentre-se e certifique-se de saber exatamente o que deseja.', author: 'Paulo Coelho' },
    { text: 'Quando cada recurso físico e mental está focado, o poder de resolver problemas multiplica.', author: 'Norman Vincent Peale' },
    { text: 'Foque mais no seu desejo do que na sua dúvida, e o sonho cuidará de si mesmo.', author: 'Mark Twain' },
]

const BREAK_QUOTES = [
    { text: 'Descanso não é ociosidade. Às vezes, é necessário deitar na grama em um dia de verão.', author: 'John Lubbock' },
    { text: 'Quase tudo funcionará de novo se você desligar por alguns minutos, inclusive você.', author: 'Anne Lamott' },
    { text: 'Sua calma é sua maior arma contra os desafios.', author: 'Dalai Lama' },
    { text: 'Faça uma pausa. Respire. Deixe ir. E lembre-se de que este momento é o único que você tem certeza.', author: 'Oprah Winfrey' },
    { text: 'Não há nada mais importante do que cuidar de si mesmo primeiro.', author: 'Eleanor Brown' },
]

export function CleanView({
    elapsedLabel,
    remainingLabel,
    metodo,
    isFullscreen,
    onToggleFullscreen,
    fullscreenError,
    state,
    onPause,
    onResume,
    onShowFinalizeModal,
    pomodoroPhase = 'focus',
    pomodoroCycle = 1,
    totalCycles = 4
}: CleanViewProps) {
    const [showControls, setShowControls] = useState(true)
    const [quoteIndex, setQuoteIndex] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    // Detect reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    // Auto-hide controls after 3s of inactivity
    useEffect(() => {
        let timeout: NodeJS.Timeout

        const resetTimer = () => {
            setShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }

        resetTimer()

        const handleMouseMove = () => resetTimer()
        const handleKeyDown = () => resetTimer()

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            clearTimeout(timeout)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    // Rotate quotes every 45 seconds (update happens in callback)
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => prev + 1)
        }, 45000)

        return () => clearInterval(interval)
    }, [])

    // Calculate progress percentage
    const getProgress = useCallback(() => {
        if (metodo === 'cronometro') {
            const elapsed = state.elapsedMs || 0
            const chunk = 25 * 60 * 1000
            return (elapsed % chunk) / chunk
        }
        if (state.remainingMs !== null && state.elapsedMs !== undefined) {
            const total = state.elapsedMs + state.remainingMs
            return total > 0 ? state.elapsedMs / total : 0
        }
        return 0
    }, [metodo, state.elapsedMs, state.remainingMs])

    const progress = getProgress()
    const circumference = 2 * Math.PI * 140
    const strokeDashoffset = circumference - (progress * circumference)

    const isBreak = pomodoroPhase === 'short_break' || pomodoroPhase === 'long_break'
    const isPaused = state.paused

    const quotes = isBreak ? BREAK_QUOTES : MOTIVATIONAL_QUOTES
    const currentQuote = quotes[quoteIndex % quotes.length]

    const getPhaseColor = () => {
        if (isPaused) return 'text-amber-400'
        if (isBreak) return 'text-emerald-400'
        return 'text-sky-400'
    }

    const getPhaseLabel = () => {
        if (metodo !== 'pomodoro') return null
        if (pomodoroPhase === 'short_break') return 'Pausa Curta'
        if (pomodoroPhase === 'long_break') return 'Pausa Longa'
        return `Ciclo ${pomodoroCycle} de ${totalCycles}`
    }

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Modo Foco - Sessão ativa"
            onMouseMove={() => setShowControls(true)}
        >
            {/* Animated Aurora Background - pointer-events-none to allow clicks through */}
            <div className="absolute inset-0 bg-slate-950 pointer-events-none">
                {!reducedMotion && (
                    <>
                        {/* Aurora layers */}
                        <div
                            className={cn(
                                'absolute inset-0 opacity-40 transition-opacity duration-1000',
                                isPaused && 'opacity-20'
                            )}
                        >
                            {/* Primary aurora wave */}
                            <div
                                className={cn(
                                    'absolute w-[200%] h-[200%] -left-1/2 -top-1/2',
                                    !reducedMotion && 'animate-aurora-slow'
                                )}
                                style={{
                                    background: isBreak
                                        ? 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.15) 40%, transparent 70%)'
                                        : isPaused
                                            ? 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 40%, transparent 70%)'
                                            : 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(56, 189, 248, 0.25) 0%, rgba(59, 130, 246, 0.15) 40%, transparent 70%)'
                                }}
                            />
                            {/* Secondary aurora wave */}
                            <div
                                className={cn(
                                    'absolute w-[200%] h-[200%] -left-1/2 -top-1/2',
                                    !reducedMotion && 'animate-aurora-medium'
                                )}
                                style={{
                                    background: isBreak
                                        ? 'radial-gradient(ellipse 60% 40% at 60% 60%, rgba(52, 211, 153, 0.2) 0%, transparent 60%)'
                                        : isPaused
                                            ? 'radial-gradient(ellipse 60% 40% at 60% 60%, rgba(252, 211, 77, 0.15) 0%, transparent 60%)'
                                            : 'radial-gradient(ellipse 60% 40% at 60% 60%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)'
                                }}
                            />
                            {/* Tertiary aurora wave */}
                            <div
                                className={cn(
                                    'absolute w-[200%] h-[200%] -left-1/2 -top-1/2',
                                    !reducedMotion && 'animate-aurora-fast'
                                )}
                                style={{
                                    background: isBreak
                                        ? 'radial-gradient(ellipse 50% 30% at 40% 40%, rgba(74, 222, 128, 0.15) 0%, transparent 50%)'
                                        : isPaused
                                            ? 'radial-gradient(ellipse 50% 30% at 40% 40%, rgba(253, 224, 71, 0.1) 0%, transparent 50%)'
                                            : 'radial-gradient(ellipse 50% 30% at 40% 40%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)'
                                }}
                            />
                        </div>
                        {/* Subtle noise overlay for texture */}
                        <div
                            className="absolute inset-0 opacity-[0.015]"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                            }}
                        />
                    </>
                )}
                {/* Fallback for reduced motion */}
                {reducedMotion && (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: isBreak
                                ? 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
                                : isPaused
                                    ? 'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 70%)'
                                    : 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 70%)'
                        }}
                    />
                )}
            </div>

            {/* Top controls bar - auto-hide */}
            <div
                className={cn(
                    'absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 transition-[opacity,transform] duration-500 motion-reduce:transition-none',
                    showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
                )}
            >
                {/* Phase indicator (Pomodoro) */}
                <div className="flex items-center gap-3">
                    {metodo === 'pomodoro' && (
                        <div className={cn(
                            'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors',
                            isBreak
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                        )}>
                            {isBreak ? <Coffee className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                            {getPhaseLabel()}
                        </div>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onToggleFullscreen}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onShowFinalizeModal}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        aria-label="Encerrar sessão"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main content - centered */}
            <div className="h-full w-full flex flex-col items-center justify-center px-6 relative z-10">
                {/* Timer with integrated controls */}
                <div className="relative flex items-center justify-center">
                    {/* Progress ring */}
                    <svg
                        className={cn(
                            'absolute -rotate-90 transition-opacity duration-1000 motion-reduce:transition-none',
                            reducedMotion && 'transition-none'
                        )}
                        width="320"
                        height="320"
                        aria-hidden="true"
                    >
                        {/* Glow filter */}
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Background circle */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-white/10"
                        />
                        {/* Progress circle with glow */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#glow)"
                            className={cn(
                                'transition-[stroke-dashoffset] duration-1000 motion-reduce:transition-none',
                                getPhaseColor(),
                                reducedMotion && 'transition-none'
                            )}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                        />
                    </svg>

                    {/* Time display + Click to pause */}
                    <button
                        type="button"
                        onClick={state.paused ? onResume : onPause}
                        className={cn(
                            'relative z-10 text-center cursor-pointer group rounded-full p-8',
                            'transition-colors duration-200 motion-reduce:transition-none',
                            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-4 focus:ring-offset-transparent'
                        )}
                        aria-label={state.paused ? 'Retomar sessão' : 'Pausar sessão'}
                    >
                        {/* Time */}
                        <div
                            className={cn(
                                'text-7xl md:text-8xl font-light tabular-nums tracking-tight transition-opacity duration-500 motion-reduce:transition-none',
                                'text-white',
                                state.paused && 'opacity-60'
                            )}
                            role="timer"
                            aria-live="polite"
                        >
                            {elapsedLabel}
                        </div>

                        {(metodo === 'timer' || metodo === 'pomodoro') && (
                            <div className="mt-1 text-lg text-slate-400 tabular-nums">
                                {remainingLabel} restantes
                            </div>
                        )}

                        {/* Hover/Paused indicator */}
                        <div className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none',
                            'bg-white/0 group-hover:bg-white/5',
                            state.paused && 'bg-white/5'
                        )}>
                            <div className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-full transition-[opacity,transform,background-color] duration-300 motion-reduce:transition-none',
                                'opacity-0 translate-y-2',
                                'group-hover:opacity-100 group-hover:translate-y-0',
                                state.paused && 'opacity-100 translate-y-0 bg-amber-500/20'
                            )}>
                                {state.paused ? (
                                    <>
                                        <Play className="h-5 w-5 text-amber-400" />
                                        <span className="text-sm font-medium text-amber-400">Clique para retomar</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause className="h-5 w-5 text-slate-300" />
                                        <span className="text-sm font-medium text-slate-300">Clique para pausar</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </button>
                </div>

                {/* Quote section */}
                <div className={cn(
                    'absolute bottom-28 md:bottom-32 left-0 right-0 px-8 transition-opacity duration-700 motion-reduce:transition-none',
                    showControls ? 'opacity-80' : 'opacity-50'
                )}>
                    <blockquote className="max-w-2xl mx-auto text-center">
                        <p className={cn(
                            'text-base md:text-lg text-slate-300 italic leading-relaxed',
                            'transition-colors duration-500 motion-reduce:transition-none'
                        )}>
                            &ldquo;{currentQuote.text}&rdquo;
                        </p>
                        <footer className="mt-3 text-sm text-slate-500">
                            — {currentQuote.author}
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Bottom hint */}
            <div className={cn(
                'absolute bottom-6 left-0 right-0 text-center z-20 transition-[opacity,transform] duration-500 motion-reduce:transition-none pointer-events-none',
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
                <p className="text-xs text-slate-500">
                    Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Esc</kbd> para sair sem encerrar
                </p>
            </div>

            {/* Fullscreen error toast */}
            {fullscreenError && (
                <div className="absolute bottom-6 left-6 max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 backdrop-blur-sm px-4 py-3 z-30 pointer-events-auto">
                    <p className="text-sm text-red-400">{fullscreenError}</p>
                </div>
            )}

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
                @keyframes aurora-fast {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    50% { transform: translate(10%, -10%) rotate(10deg); }
                }
                .animate-aurora-slow {
                    animation: aurora-slow 30s ease-in-out infinite;
                }
                .animate-aurora-medium {
                    animation: aurora-medium 20s ease-in-out infinite;
                }
                .animate-aurora-fast {
                    animation: aurora-fast 15s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
