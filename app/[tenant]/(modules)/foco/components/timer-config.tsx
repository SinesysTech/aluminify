'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        borderColor: 'border-blue-500',
    },
    {
        id: 'timer' as MetodoEstudo,
        icon: Hourglass,
        label: 'Timer',
        description: 'Tempo definido',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500',
    },
    {
        id: 'pomodoro' as MetodoEstudo,
        icon: Zap,
        label: 'Pomodoro',
        description: 'Ciclos de foco',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500',
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
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Settings2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Como você quer estudar?</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Escolha o método e configure o tempo
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Method Selection - Horizontal Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {METHODS.map((method) => {
                        const Icon = method.icon
                        const isSelected = metodo === method.id

                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => onMetodoChange(method.id)}
                                className={cn(
                                    'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
                                    isSelected
                                        ? `${method.borderColor} ${method.bgColor} shadow-sm`
                                        : 'border-muted hover:border-muted-foreground/30'
                                )}
                            >
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                    isSelected ? method.bgColor : 'bg-muted'
                                )}>
                                    <Icon className={cn(
                                        'h-6 w-6 transition-colors',
                                        isSelected ? method.color : 'text-muted-foreground'
                                    )} />
                                </div>
                                <div className="text-center">
                                    <p className={cn(
                                        'font-semibold text-sm',
                                        isSelected && 'text-foreground'
                                    )}>
                                        {method.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {method.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className={cn(
                                        'absolute -top-1 -right-1 h-3 w-3 rounded-full',
                                        method.color.replace('text-', 'bg-')
                                    )} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Configuration Panel */}
                <div className="min-h-[160px]">
                    {/* Cronômetro - No config needed */}
                    {metodo === 'cronometro' && (
                        <div className="flex flex-col items-center justify-center h-40 text-center p-6 rounded-lg bg-muted/30 border border-dashed">
                            <Timer className="h-8 w-8 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                O cronômetro livre não precisa de configuração.
                                <br />
                                <span className="text-xs">Você controla quando parar.</span>
                            </p>
                        </div>
                    )}

                    {/* Timer - Duration presets + slider */}
                    {metodo === 'timer' && (
                        <div className="space-y-5">
                            {/* Presets */}
                            <div className="flex gap-2">
                                {TIMER_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => onTimerMinChange(preset.value)}
                                        className={cn(
                                            'flex-1 py-2.5 px-3 rounded-lg border text-center transition-all cursor-pointer',
                                            'hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                                            timerMin === preset.value
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                : 'border-muted hover:bg-muted/50'
                                        )}
                                    >
                                        <p className="font-semibold text-sm">{preset.label}</p>
                                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Custom slider */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Duração personalizada</Label>
                                    <span className="text-lg font-bold text-amber-500 tabular-nums">
                                        {timerMin} min
                                    </span>
                                </div>
                                <Slider
                                    value={[timerMin]}
                                    onValueChange={(v) => onTimerMinChange(v[0])}
                                    min={5}
                                    max={180}
                                    step={5}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>5 min</span>
                                    <span>3 horas</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pomodoro - Presets + Advanced */}
                    {metodo === 'pomodoro' && (
                        <div className="space-y-5">
                            {/* Presets */}
                            <div className="flex gap-2">
                                {POMODORO_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyPomodoroPreset(preset)}
                                        className={cn(
                                            'flex-1 py-2.5 px-3 rounded-lg border text-center transition-all cursor-pointer',
                                            'hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                                            getCurrentPomodoroPreset() === preset.label
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'border-muted hover:bg-muted/50'
                                        )}
                                    >
                                        <p className="font-semibold text-sm">{preset.label}</p>
                                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-lg bg-muted/30">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-500">{focusMin}</p>
                                    <p className="text-xs text-muted-foreground">min foco</p>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-500">{shortBreakMin}</p>
                                    <p className="text-xs text-muted-foreground">min pausa</p>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-violet-500">{pomodoroCycles}</p>
                                    <p className="text-xs text-muted-foreground">ciclos</p>
                                </div>
                            </div>

                            {/* Advanced toggle */}
                            <button
                                type="button"
                                onClick={() => setShowAdvancedPomodoro(!showAdvancedPomodoro)}
                                className="flex items-center justify-between w-full py-2 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 cursor-pointer"
                            >
                                <span>Configuração avançada</span>
                                {showAdvancedPomodoro ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>

                            {/* Advanced config */}
                            {showAdvancedPomodoro && (
                                <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                                    {/* Focus time */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>Tempo de foco</Label>
                                            <span className="font-mono text-emerald-500">{focusMin} min</span>
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
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>Pausa curta</Label>
                                            <span className="font-mono text-blue-500">{shortBreakMin} min</span>
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
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>Pausa longa</Label>
                                            <span className="font-mono text-violet-500">{longBreakMin} min</span>
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
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>Ciclos</Label>
                                            <span className="font-mono">{pomodoroCycles}</span>
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

                {/* Start Button */}
                <Button
                    size="lg"
                    className="w-full h-14 text-lg gap-3 shadow-lg hover:shadow-xl transition-shadow"
                    onClick={onStart}
                    disabled={iniciando || !disciplinaId}
                >
                    {iniciando ? (
                        <>
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Iniciando...
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5 fill-current" />
                            Iniciar Sessão de Foco
                        </>
                    )}
                </Button>

                {!disciplinaId && (
                    <p className="text-center text-sm text-muted-foreground">
                        Selecione uma disciplina acima para começar
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
