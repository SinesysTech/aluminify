'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Timer, Hourglass, Zap, Play } from 'lucide-react'
import { MetodoEstudo } from '@/types/sessao-estudo'

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

    const focusMin = Math.round(pomodoroFocusMs / 60000)
    const shortBreakMin = Math.round(pomodoroShortBreakMs / 60000)
    const longBreakMin = Math.round(pomodoroLongBreakMs / 60000)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Esquerda: Seleção do Método */}
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Método</CardTitle>
                    <CardDescription>Como você prefere gerenciar seu tempo?</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={metodo}
                        onValueChange={(v) => onMetodoChange(v as MetodoEstudo)}
                        className="grid gap-4"
                    >
                        <div>
                            <RadioGroupItem value="cronometro" id="m-cron" className="peer sr-only" />
                            <Label
                                htmlFor="m-cron"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Timer className="mb-3 h-6 w-6" />
                                <span className="font-semibold">Cronômetro Livre</span>
                                <span className="text-xs text-muted-foreground mt-1 text-center">
                                    Inicie e pare quando quiser. Ideal para sessões flexíveis.
                                </span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="timer" id="m-timer" className="peer sr-only" />
                            <Label
                                htmlFor="m-timer"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Hourglass className="mb-3 h-6 w-6" />
                                <span className="font-semibold">Timer Regressivo</span>
                                <span className="text-xs text-muted-foreground mt-1 text-center">
                                    Defina um tempo fixo (ex: 60 min) e tente cumprir.
                                </span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="pomodoro" id="m-pomo" className="peer sr-only" />
                            <Label
                                htmlFor="m-pomo"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Zap className="mb-3 h-6 w-6" />
                                <span className="font-semibold">Pomodoro</span>
                                <span className="text-xs text-muted-foreground mt-1 text-center">
                                    Ciclos de foco e pausa (ex: 25/5). Ótimo para manter o ritmo.
                                </span>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Direita: Configurações Específicas e Botão Iniciar */}
            <div className="space-y-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Configuração</CardTitle>
                        <CardDescription>Ajuste os parâmetros do método selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {metodo === 'cronometro' && (
                            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm italic border rounded-md bg-muted/10">
                                Nenhuma configuração necessária para o modo Livre.
                            </div>
                        )}

                        {metodo === 'timer' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Duração (minutos)</Label>
                                    <span className="text-sm font-medium">{timerMin} min</span>
                                </div>
                                <Slider
                                    value={[timerMin]}
                                    onValueChange={(v) => onTimerMinChange(v[0])}
                                    min={5}
                                    max={240}
                                    step={5}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>5 min</span>
                                    <span>4 horas</span>
                                </div>
                            </div>
                        )}

                        {metodo === 'pomodoro' && (
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Label>Tempo de Foco</Label>
                                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                            {focusMin} min
                                        </span>
                                    </div>
                                    <Slider
                                        value={[focusMin]}
                                        onValueChange={(v) => onPomodoroFocusChange(v[0] * 60000)}
                                        min={10}
                                        max={90}
                                        step={5}
                                    />
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Pausa Curta</Label>
                                        <Input
                                            type="number"
                                            value={shortBreakMin}
                                            onChange={(e) => onPomodoroShortBreakChange(Number(e.target.value) * 60000)}
                                            min={1}
                                            max={30}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Pausa Longa</Label>
                                        <Input
                                            type="number"
                                            value={longBreakMin}
                                            onChange={(e) => onPomodoroLongBreakChange(Number(e.target.value) * 60000)}
                                            min={5}
                                            max={60}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Ciclos Totais</Label>
                                    <Input
                                        type="number"
                                        value={pomodoroCycles}
                                        onChange={(e) => onPomodoroCyclesChange(Number(e.target.value))}
                                        min={1}
                                        max={10}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button
                    size="lg"
                    className="w-full text-lg h-14"
                    onClick={onStart}
                    disabled={iniciando || !disciplinaId}
                >
                    {iniciando ? (
                        'Iniciando...'
                    ) : (
                        <>
                            <Play className="mr-2 h-5 w-5 fill-current" />
                            Iniciar Sessão
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
