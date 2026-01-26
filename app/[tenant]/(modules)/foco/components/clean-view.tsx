'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Activity, StopCircle } from 'lucide-react'
import { StudyTimerState } from '@/hooks/use-study-timer'

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
}

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
    onShowFinalizeModal
}: CleanViewProps) {

    return (
        <div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Modo Foco - Tela limpa"
        >
            <div className="h-full w-full flex flex-col">
                {/* Header Compacto */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-background/60">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1">
                        <span className="text-[11px] text-muted-foreground">Foco</span>
                        <span className="text-sm font-semibold tabular-nums">{elapsedLabel}</span>
                        {(metodo === 'timer' || metodo === 'pomodoro') && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                restante {remainingLabel}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onToggleFullscreen}
                            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
                        >
                            {isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
                        </Button>

                        {state.running && !state.paused && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onPause}
                                aria-label="Pausar sessão"
                                autoFocus
                            >
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                            </Button>
                        )}
                        {state.running && state.paused && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onResume}
                                aria-label="Retomar sessão"
                                autoFocus
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                Retomar
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={onShowFinalizeModal}
                            disabled={!state.startedAt}
                            aria-label="Encerrar sessão"
                        >
                            <StopCircle className="h-4 w-4 mr-2" />
                            Encerrar
                        </Button>
                    </div>
                </div>

                {/* Corpo Overlay */}
                <div className="flex-1 flex items-center justify-center px-6 relative">
                    {fullscreenError && (
                        <div className="absolute bottom-4 left-4 max-w-sm rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                            <p className="text-xs text-destructive">{fullscreenError}</p>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground absolute bottom-4 right-4">
                        Dica: pressione <span className="font-semibold">Esc</span> para sair desta tela sem encerrar.
                    </p>

                    <div className="text-center">
                        <h1 className="text-6xl font-black tracking-tight mb-4 text-foreground/80">
                            {elapsedLabel}
                        </h1>
                        {(metodo === 'timer' || metodo === 'pomodoro') && (
                            <p className="text-2xl text-muted-foreground/60">{remainingLabel} restantes</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
