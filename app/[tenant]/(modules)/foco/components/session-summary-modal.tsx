'use client'

import React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/shared/components/overlay/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/app/shared/components/forms/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/app/shared/components/forms/checkbox'
import {
    Clock,
    Pause,
    AlertTriangle,
    CheckCircle2,
    Trophy,
    TrendingUp,
    Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionSummaryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    elapsedMs: number
    pauseCount: number
    distractionCount: number
    totalPauseMs: number
    nivelFoco: number
    onNivelFocoChange: (value: number) => void
    concluiuAtividade: boolean
    onConcluiuAtividadeChange: (value: boolean) => void
    hasAtividade: boolean
    atividadeNome?: string
    onFinalize: () => void
    finalizando: boolean
}

const FOCUS_LEVELS = [
    { value: 1, label: 'Socorro', emoji: '😵', color: 'text-red-500' },
    { value: 2, label: 'Difícil', emoji: '😓', color: 'text-orange-500' },
    { value: 3, label: 'Normal', emoji: '😐', color: 'text-amber-500' },
    { value: 4, label: 'Bom', emoji: '🙂', color: 'text-emerald-500' },
    { value: 5, label: 'Excelente', emoji: '🧘', color: 'text-primary' },
]

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
        return `${hours}h ${minutes}min`
    }
    if (minutes > 0) {
        return `${minutes}min ${seconds}s`
    }
    return `${seconds}s`
}

export function SessionSummaryModal({
    open,
    onOpenChange,
    elapsedMs,
    pauseCount,
    distractionCount,
    totalPauseMs,
    nivelFoco,
    onNivelFocoChange,
    concluiuAtividade,
    onConcluiuAtividadeChange,
    hasAtividade,
    atividadeNome,
    onFinalize,
    finalizando
}: SessionSummaryModalProps) {
    const netStudyTime = elapsedMs - totalPauseMs
    const efficiencyPercent = elapsedMs > 0 ? Math.round((netStudyTime / elapsedMs) * 100) : 100
    const currentLevel = FOCUS_LEVELS.find(l => l.value === nivelFoco) || FOCUS_LEVELS[2]

    // Determine session quality
    const getSessionQuality = () => {
        if (efficiencyPercent >= 90 && distractionCount === 0) return 'excellent'
        if (efficiencyPercent >= 75 && distractionCount <= 2) return 'good'
        if (efficiencyPercent >= 50) return 'fair'
        return 'needsWork'
    }

    const quality = getSessionQuality()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto mb-3">
                        {quality === 'excellent' && (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                                <Trophy className="h-8 w-8 text-emerald-500" />
                            </div>
                        )}
                        {quality === 'good' && (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <TrendingUp className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        {quality === 'fair' && (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                                <Target className="h-8 w-8 text-amber-500" />
                            </div>
                        )}
                        {quality === 'needsWork' && (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
                                <AlertTriangle className="h-8 w-8 text-orange-500" />
                            </div>
                        )}
                    </div>
                    <DialogTitle className="text-xl">
                        {quality === 'excellent' && 'Sessão Incrível!'}
                        {quality === 'good' && 'Bom Trabalho!'}
                        {quality === 'fair' && 'Sessão Concluída'}
                        {quality === 'needsWork' && 'Continue Tentando'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {quality === 'excellent' && 'Você manteve foco excepcional nesta sessão.'}
                        {quality === 'good' && 'Você se manteve concentrado na maior parte do tempo.'}
                        {quality === 'fair' && 'Houve algumas distrações, mas você persistiu.'}
                        {quality === 'needsWork' && 'Tente reduzir as pausas na próxima sessão.'}
                    </p>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Total time */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Clock className="h-5 w-5 text-primary shrink-0" />
                            <div>
                                <p className="text-lg font-bold">{formatDuration(elapsedMs)}</p>
                                <p className="text-xs text-muted-foreground">Tempo total</p>
                            </div>
                        </div>

                        {/* Net time */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-lg font-bold">{formatDuration(netStudyTime)}</p>
                                <p className="text-xs text-muted-foreground">Tempo líquido</p>
                            </div>
                        </div>

                        {/* Pauses */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Pause className="h-5 w-5 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-lg font-bold">{pauseCount}</p>
                                <p className="text-xs text-muted-foreground">Pausas manuais</p>
                            </div>
                        </div>

                        {/* Distractions */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <AlertTriangle className={cn(
                                'h-5 w-5 shrink-0',
                                distractionCount === 0 ? 'text-emerald-500' : 'text-orange-500'
                            )} />
                            <div>
                                <p className="text-lg font-bold">{distractionCount}</p>
                                <p className="text-xs text-muted-foreground">Distrações</p>
                            </div>
                        </div>
                    </div>

                    {/* Efficiency bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Eficiência</span>
                            <span className={cn(
                                'font-bold',
                                efficiencyPercent >= 90 ? 'text-emerald-500' :
                                efficiencyPercent >= 75 ? 'text-primary' :
                                efficiencyPercent >= 50 ? 'text-amber-500' :
                                'text-orange-500'
                            )}>
                                {efficiencyPercent}%
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
                                    efficiencyPercent >= 90 ? 'bg-emerald-500' :
                                    efficiencyPercent >= 75 ? 'bg-primary' :
                                    efficiencyPercent >= 50 ? 'bg-amber-500' :
                                    'bg-orange-500'
                                )}
                                style={{ width: `${efficiencyPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Tempo líquido / Tempo total
                        </p>
                    </div>

                    {/* Focus level selector */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-sm">Como foi seu nível de foco?</Label>

                        {/* Visual level indicator */}
                        <div className="flex justify-center py-2">
                            <span className="text-4xl">{currentLevel.emoji}</span>
                        </div>

                        <Slider
                            value={[nivelFoco]}
                            onValueChange={(v) => onNivelFocoChange(v[0])}
                            min={1}
                            max={5}
                            step={1}
                            className="py-2"
                        />

                        <div className="flex justify-between text-xs px-1">
                            {FOCUS_LEVELS.map((level) => (
                                <span
                                    key={level.value}
                                    className={cn(
                                        'transition-colors',
                                        nivelFoco === level.value ? level.color + ' font-medium' : 'text-muted-foreground'
                                    )}
                                >
                                    {level.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Activity completion */}
                    {hasAtividade && (
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                            <Checkbox
                                id="check-concluded"
                                checked={concluiuAtividade}
                                onCheckedChange={(checked: boolean | 'indeterminate') => onConcluiuAtividadeChange(checked === true)}
                                className="mt-0.5"
                            />
                            <div className="space-y-1">
                                <label
                                    htmlFor="check-concluded"
                                    className="text-sm font-medium cursor-pointer leading-tight"
                                >
                                    Concluí a atividade
                                </label>
                                {atividadeNome && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {atividadeNome}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={finalizando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onFinalize}
                        disabled={finalizando}
                        className="gap-2"
                    >
                        {finalizando ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Salvar Sessão
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
