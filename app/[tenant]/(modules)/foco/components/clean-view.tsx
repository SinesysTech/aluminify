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

const MOTIVATIONAL_MESSAGES = [
    'Você está indo muito bem!',
    'Cada minuto conta.',
    'Foco é um superpoder.',
    'Mantenha o ritmo!',
    'Sua dedicação vai valer a pena.',
    'Um passo de cada vez.',
    'Concentração é a chave.',
]

const BREAK_MESSAGES = [
    'Hora de respirar.',
    'Descanse os olhos.',
    'Levante e alongue.',
    'Hidrate-se!',
    'Você merece essa pausa.',
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
    const [mouseIdle, setMouseIdle] = useState(false)
    const [motivationalMessage, setMotivationalMessage] = useState(() => {
        const isBreakInit = pomodoroPhase === 'short_break' || pomodoroPhase === 'long_break'
        const messages = isBreakInit ? BREAK_MESSAGES : MOTIVATIONAL_MESSAGES
        return messages[Math.floor(Math.random() * messages.length)]
    })
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
            setMouseIdle(false)
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setMouseIdle(true)
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

    // Rotate motivational messages
    useEffect(() => {
        const isBreak = pomodoroPhase === 'short_break' || pomodoroPhase === 'long_break'
        const messages = isBreak ? BREAK_MESSAGES : MOTIVATIONAL_MESSAGES
        const timeout = setTimeout(() => {
            setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)])
        }, 0)

        const interval = setInterval(() => {
            setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)])
        }, 30000) // Change every 30s

        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [pomodoroPhase])

    // Calculate progress percentage
    const getProgress = useCallback(() => {
        if (metodo === 'cronometro') {
            // For stopwatch, show elapsed in 25-min chunks (like pomodoro)
            const elapsed = state.elapsedMs || 0
            const chunk = 25 * 60 * 1000 // 25 minutes
            return (elapsed % chunk) / chunk
        }
        if (state.remainingMs !== null && state.elapsedMs !== undefined) {
            const total = state.elapsedMs + state.remainingMs
            return total > 0 ? state.elapsedMs / total : 0
        }
        return 0
    }, [metodo, state.elapsedMs, state.remainingMs])

    const progress = getProgress()
    const circumference = 2 * Math.PI * 140 // radius = 140
    const strokeDashoffset = circumference - (progress * circumference)

    const isBreak = pomodoroPhase === 'short_break' || pomodoroPhase === 'long_break'
    const isPaused = state.paused

    // Phase colors
    const getPhaseColor = () => {
        if (isPaused) return 'text-amber-500'
        if (isBreak) return 'text-emerald-500'
        return 'text-primary'
    }

    const getPhaseLabel = () => {
        if (metodo !== 'pomodoro') return null
        if (pomodoroPhase === 'short_break') return 'Pausa Curta'
        if (pomodoroPhase === 'long_break') return 'Pausa Longa'
        return `Ciclo ${pomodoroCycle} de ${totalCycles}`
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 bg-background transition-colors duration-500',
                isBreak && 'bg-emerald-950/95',
                isPaused && 'bg-amber-950/95'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Modo Foco - Sessão ativa"
            onMouseMove={() => setShowControls(true)}
        >
            {/* Subtle animated gradient background */}
            {!reducedMotion && (
                <div
                    className={cn(
                        'absolute inset-0 opacity-30 transition-opacity duration-1000',
                        mouseIdle ? 'opacity-10' : 'opacity-30'
                    )}
                    style={{
                        background: isBreak
                            ? 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
                            : 'radial-gradient(ellipse at 50% 50%, rgba(var(--primary-rgb, 59, 130, 246), 0.1) 0%, transparent 70%)'
                    }}
                />
            )}

            {/* Top controls bar - auto-hide */}
            <div
                className={cn(
                    'absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 transition-all duration-300',
                    showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                )}
            >
                {/* Phase indicator (Pomodoro) */}
                <div className="flex items-center gap-3">
                    {metodo === 'pomodoro' && (
                        <div className={cn(
                            'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                            isBreak ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-primary/30 bg-primary/10 text-primary'
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
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onShowFinalizeModal}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Encerrar sessão"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main content - centered */}
            <div className="h-full w-full flex flex-col items-center justify-center px-6">
                {/* Circular progress + time */}
                <div className="relative flex items-center justify-center">
                    {/* Progress ring */}
                    <svg
                        className={cn(
                            'absolute -rotate-90 transition-all duration-1000',
                            reducedMotion && 'transition-none'
                        )}
                        width="320"
                        height="320"
                        aria-hidden="true"
                    >
                        {/* Background circle */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted/20"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className={cn(
                                'transition-all duration-1000',
                                getPhaseColor(),
                                reducedMotion && 'transition-none'
                            )}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                        />
                    </svg>

                    {/* Time display */}
                    <div className="text-center z-10">
                        <div
                            className={cn(
                                'text-7xl md:text-8xl font-bold tabular-nums tracking-tight transition-colors duration-500',
                                getPhaseColor()
                            )}
                            role="timer"
                            aria-live="polite"
                            aria-label={`Tempo decorrido: ${elapsedLabel}`}
                        >
                            {elapsedLabel}
                        </div>

                        {(metodo === 'timer' || metodo === 'pomodoro') && (
                            <div className="mt-2 text-xl text-muted-foreground tabular-nums">
                                {remainingLabel} restantes
                            </div>
                        )}
                    </div>
                </div>

                {/* Pause/Resume button - always visible but subtle when idle */}
                <div className={cn(
                    'mt-12 transition-all duration-300',
                    showControls ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'
                )}>
                    {state.running && !state.paused && (
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onPause}
                            className="h-14 px-8 text-lg gap-3 border-2 hover:bg-muted/50"
                            aria-label="Pausar sessão"
                        >
                            <Pause className="h-5 w-5" />
                            Pausar
                        </Button>
                    )}
                    {state.running && state.paused && (
                        <Button
                            size="lg"
                            onClick={onResume}
                            className="h-14 px-8 text-lg gap-3"
                            aria-label="Retomar sessão"
                            autoFocus
                        >
                            <Play className="h-5 w-5" />
                            Retomar
                        </Button>
                    )}
                </div>

                {/* Motivational message - subtle */}
                <div className={cn(
                    'absolute bottom-24 text-center transition-all duration-500',
                    showControls ? 'opacity-60' : 'opacity-30'
                )}>
                    <p className="text-sm text-muted-foreground italic">
                        {isPaused ? 'Sessão pausada' : motivationalMessage}
                    </p>
                </div>
            </div>

            {/* Bottom hint */}
            <div className={cn(
                'absolute bottom-6 left-0 right-0 text-center transition-all duration-300',
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
                <p className="text-xs text-muted-foreground/60">
                    Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Esc</kbd> para sair sem encerrar
                </p>
            </div>

            {/* Fullscreen error toast */}
            {fullscreenError && (
                <div className="absolute bottom-6 left-6 max-w-sm rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">{fullscreenError}</p>
                </div>
            )}
        </div>
    )
}
