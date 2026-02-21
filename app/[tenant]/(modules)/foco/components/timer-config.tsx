'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/app/shared/components/forms/label'
import { Slider } from '@/components/ui/slider'
import { Timer, Hourglass, Zap, Play, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { MetodoEstudo } from '@/app/[tenant]/(modules)/sala-de-estudos/types'
import { cn } from '@/lib/utils'

interface TimerConfigProps {
    metodo: MetodoEstudo
    onMetodoChange: (m: MetodoEstudo) => void
    timerMin: number
    onTimerMinChange: (min: number) => void

    pomodoroFocusMs: number
    onPomodoroFocusChange: (ms: number) => void
    pomodoroShortBreakMs: number
    onPomodoroShortBreakChange: (ms: number) => void
    pomodoroLongBreakMs: number
    onPomodoroLongBreakChange: (ms: number) => void
    pomodoroCycles: number
    onPomodoroCyclesChange: (cycles: number) => void

    onStart: () => void
    iniciando: boolean
    disciplinaId: string
}

// Timer presets
const TIMER_PRESETS = [
    { label: 'Rápido', value: 15, description: '15 min' },
    { label: 'Padrão', value: 25, description: '25 min' },
    { label: 'Longo', value: 50, description: '50 min' },
    { label: 'Maratona', value: 90, description: '90 min' },
]

// Pomodoro presets
const POMODORO_PRESETS = [
    {
        label: 'Iniciante',
        focusMs: 15 * 60 * 1000,
        shortBreakMs: 3 * 60 * 1000,
        longBreakMs: 10 * 60 * 1000,
        cycles: 4,
        description: '15/3/10 min'
    },
    {
        label: 'Padrão',
        focusMs: 25 * 60 * 1000,
        shortBreakMs: 5 * 60 * 1000,
        longBreakMs: 15 * 60 * 1000,
        cycles: 4,
        description: '25/5/15 min'
    },
    {
        label: 'Intenso',
        focusMs: 50 * 60 * 1000,
        shortBreakMs: 10 * 60 * 1000,
        longBreakMs: 30 * 60 * 1000,
        cycles: 4,
        description: '50/10/30 min'
    },
]

const METHODS = [
    {
        id: 'cronometro' as MetodoEstudo,
        icon: Timer,
        label: 'Livre',
        description: 'Sem limite de tempo',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/60',
        ringColor: 'ring-blue-500/20',
    },
    {
        id: 'timer' as MetodoEstudo,
        icon: Hourglass,
        label: 'Timer',
        description: 'Tempo definido',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/60',
        ringColor: 'ring-amber-500/20',
    },
    {
        id: 'pomodoro' as MetodoEstudo,
        icon: Zap,
        label: 'Pomodoro',
        description: 'Ciclos de foco',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/60',
        ringColor: 'ring-emerald-500/20',
    },
]

export function TimerConfig({
    metodo,
    onMetodoChange,
    timerMin,
    onTimerMinChange,
    pomodoroFocusMs,
    onPomodoroFocusChange,
    pomodoroShortBreakMs,
    onPomodoroShortBreakChange,
    pomodoroLongBreakMs,
    onPomodoroLongBreakChange,
    pomodoroCycles,
    onPomodoroCyclesChange,
    onStart,
    iniciando,
    disciplinaId
}: TimerConfigProps) {
    const [showAdvancedPomodoro, setShowAdvancedPomodoro] = useState(false)

    const focusMin = Math.round(pomodoroFocusMs / 60000)
    const shortBreakMin = Math.round(pomodoroShortBreakMs / 60000)
    const longBreakMin = Math.round(pomodoroLongBreakMs / 60000)

    // Check if current pomodoro matches a preset
    const getCurrentPomodoroPreset = () => {
        return POMODORO_PRESETS.find(p =>
            p.focusMs === pomodoroFocusMs &&
            p.shortBreakMs === pomodoroShortBreakMs &&
            p.longBreakMs === pomodoroLongBreakMs
        )?.label || 'Personalizado'
    }

    const applyPomodoroPreset = (preset: typeof POMODORO_PRESETS[0]) => {
        onPomodoroFocusChange(preset.focusMs)
        onPomodoroShortBreakChange(preset.shortBreakMs)
        onPomodoroLongBreakChange(preset.longBreakMs)
        onPomodoroCyclesChange(preset.cycles)
    }

    return (
        <Card className="overflow-hidden border-border/60">
            <CardContent className="p-5 md:p-6 space-y-5">
                {/* Section header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Settings2 className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold tracking-tight">Como você quer estudar?</h2>
                </div>

                {/* Method Selection - Horizontal Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                    {METHODS.map((method) => {
                        const Icon = method.icon
                        const isSelected = metodo === method.id

                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => onMetodoChange(method.id)}
                                className={cn(
                                    'relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors duration-200 motion-reduce:transition-none cursor-pointer',
                                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
                                    isSelected
                                        ? `${method.borderColor} ${method.bgColor} ring-2 ${method.ringColor} shadow-sm`
                                        : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30'
                                )}
                            >
                                <div className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none',
                                    isSelected ? `${method.bgColor}` : 'bg-muted'
                                )}>
                                    <Icon className={cn(
                                        'h-4.5 w-4.5 transition-colors',
                                        isSelected ? method.color : 'text-muted-foreground'
                                    )} />
                                </div>
                                <div className="text-center">
                                    <p className={cn(
                                        'font-semibold text-sm',
                                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                                    )}>
                                        {method.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                        {method.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Configuration Panel */}
                <div className="min-h-22">
                    {/* Cronômetro - No config needed */}
                    {metodo === 'cronometro' && (
                        <div className="flex flex-col items-center justify-center h-25 text-center p-5 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20">
                            <Timer className="h-5 w-5 text-muted-foreground/60 mb-2.5" />
                            <p className="text-sm text-muted-foreground">
                                O cronômetro livre não precisa de configuração.
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Você controla quando parar.</p>
                        </div>
                    )}

                    {/* Timer - Duration presets + slider */}
                    {metodo === 'timer' && (
                        <div className="space-y-3">
                            {/* Presets */}
                            <div className="grid grid-cols-4 gap-1.5">
                                {TIMER_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => onTimerMinChange(preset.value)}
                                        className={cn(
                                            'py-2.5 px-2 rounded-lg border text-center transition-colors duration-200 motion-reduce:transition-none cursor-pointer',
                                            'hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                                            timerMin === preset.value
                                                ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                                                : 'border-muted hover:bg-muted/50'
                                        )}
                                    >
                                        <p className="font-medium text-xs">{preset.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Custom slider */}
                            <div className="space-y-2 px-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Personalizar</Label>
                                    <span className="text-sm font-bold text-amber-500 tabular-nums">
                                        {timerMin} min
                                    </span>
                                </div>
                                <Slider
                                    value={[timerMin]}
                                    onValueChange={(v) => onTimerMinChange(v[0])}
                                    min={5}
                                    max={180}
                                    step={5}
                                />
                            </div>
                        </div>
                    )}

                    {/* Pomodoro - Presets + Advanced */}
                    {metodo === 'pomodoro' && (
                        <div className="space-y-3">
                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-1.5">
                                {POMODORO_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyPomodoroPreset(preset)}
                                        className={cn(
                                            'py-2.5 px-2 rounded-lg border text-center transition-colors duration-200 motion-reduce:transition-none cursor-pointer',
                                            'hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                                            getCurrentPomodoroPreset() === preset.label
                                                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                                                : 'border-muted hover:bg-muted/50'
                                        )}
                                    >
                                        <p className="font-medium text-xs">{preset.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl bg-muted/30 border border-dashed">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-emerald-500 tabular-nums">{focusMin}</p>
                                    <p className="text-[10px] text-muted-foreground">foco</p>
                                </div>
                                <div className="h-6 w-px bg-border" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-blue-500 tabular-nums">{shortBreakMin}</p>
                                    <p className="text-[10px] text-muted-foreground">pausa</p>
                                </div>
                                <div className="h-6 w-px bg-border" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-violet-500 tabular-nums">{pomodoroCycles}</p>
                                    <p className="text-[10px] text-muted-foreground">ciclos</p>
                                </div>
                            </div>

                            {/* Advanced toggle */}
                            <button
                                type="button"
                                onClick={() => setShowAdvancedPomodoro(!showAdvancedPomodoro)}
                                className="flex items-center justify-between w-full py-2 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                                <span>Configuração avançada</span>
                                {showAdvancedPomodoro ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                            </button>

                            {/* Advanced config */}
                            {showAdvancedPomodoro && (
                                <div className="space-y-3 pt-1 pl-4 border-l-2 border-muted">
                                    {/* Focus time */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <Label className="text-xs">Tempo de foco</Label>
                                            <span className="font-mono text-emerald-500 font-medium">{focusMin} min</span>
                                        </div>
                                        <Slider
                                            value={[focusMin]}
                                            onValueChange={(v) => onPomodoroFocusChange(v[0] * 60000)}
                                            min={10}
                                            max={90}
                                            step={5}
                                        />
                                    </div>

                                    {/* Short break */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <Label className="text-xs">Pausa curta</Label>
                                            <span className="font-mono text-blue-500 font-medium">{shortBreakMin} min</span>
                                        </div>
                                        <Slider
                                            value={[shortBreakMin]}
                                            onValueChange={(v) => onPomodoroShortBreakChange(v[0] * 60000)}
                                            min={1}
                                            max={15}
                                            step={1}
                                        />
                                    </div>

                                    {/* Long break */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <Label className="text-xs">Pausa longa</Label>
                                            <span className="font-mono text-violet-500 font-medium">{longBreakMin} min</span>
                                        </div>
                                        <Slider
                                            value={[longBreakMin]}
                                            onValueChange={(v) => onPomodoroLongBreakChange(v[0] * 60000)}
                                            min={5}
                                            max={45}
                                            step={5}
                                        />
                                    </div>

                                    {/* Cycles */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <Label className="text-xs">Ciclos</Label>
                                            <span className="font-mono font-medium">{pomodoroCycles}</span>
                                        </div>
                                        <Slider
                                            value={[pomodoroCycles]}
                                            onValueChange={(v) => onPomodoroCyclesChange(v[0])}
                                            min={1}
                                            max={8}
                                            step={1}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Start Button - Prominent CTA */}
                <div className="pt-1 space-y-2.5">
                    <Button
                        size="lg"
                        className={cn(
                            'w-full h-13 text-sm font-semibold gap-2.5 transition-colors duration-200 motion-reduce:transition-none',
                            'bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
                            'shadow-lg hover:shadow-xl',
                            'disabled:opacity-50 disabled:shadow-none'
                        )}
                        onClick={onStart}
                        disabled={iniciando || !disciplinaId}
                    >
                        {iniciando ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <Play className="h-4.5 w-4.5 fill-current" />
                                Iniciar Sessão de Foco
                            </>
                        )}
                    </Button>

                    {!disciplinaId && (
                        <p className="text-center text-xs text-muted-foreground">
                            Selecione uma disciplina acima para começar
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
