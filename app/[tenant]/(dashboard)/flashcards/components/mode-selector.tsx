'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { MODOS } from '../types'

interface ModeSelectorProps {
    modo?: string | null
    scope: 'all' | 'completed'
    onSelectMode: (modeId: string) => void
    onScopeChange: (scope: 'all' | 'completed') => void
    isLoading?: boolean
}

export function ModeSelector({
    modo,
    scope,
    onSelectMode,
    onScopeChange,
    isLoading = false,
}: ModeSelectorProps) {
    const handleKeyDown = (e: React.KeyboardEvent, modeId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectMode(modeId)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    Flashcards
                    <Badge variant="secondary">SRS</Badge>
                </h1>
                <p className="text-muted-foreground mt-2">
                    Selecione o modo e revise com espaçamento inteligente.
                </p>
            </div>

            {/* Escopo da revisão */}
            <Card className="border-primary/70 bg-muted/25 shadow-lg">
                <CardContent className="px-4 md:px-6 py-0">
                    <div className="grid gap-3 md:grid-cols-2 md:items-start">
                        {/* Coluna esquerda: título + descrição */}
                        <div className="space-y-1 py-4">
                            <CardTitle className="text-base">Fonte dos flashcards</CardTitle>
                            <CardDescription>
                                Escolha se a revisão considera todos os módulos do seu curso ou apenas os módulos concluídos.
                            </CardDescription>
                        </div>

                        {/* Coluna direita: seletor */}
                        <div className="space-y-2 md:justify-self-end md:w-full md:max-w-md py-4">
                            <Label>Gerar flashcards a partir de</Label>
                            <div className="flex flex-col gap-2 rounded-md border bg-background/50 p-2">
                                <div className="flex flex-wrap items-center gap-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={scope === 'all'}
                                            onCheckedChange={(checked) => {
                                                if (checked) onScopeChange('all')
                                            }}
                                            disabled={isLoading || modo === 'personalizado'}
                                            aria-label="Todos os módulos do meu curso"
                                        />
                                        <span>Todos os módulos do meu curso</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={scope === 'completed'}
                                            onCheckedChange={(checked) => {
                                                if (checked) onScopeChange('completed')
                                            }}
                                            disabled={isLoading || modo === 'personalizado'}
                                            aria-label="Apenas módulos concluídos"
                                        />
                                        <span>Apenas módulos concluídos</span>
                                    </label>
                                </div>
                                {modo === 'personalizado' && (
                                    <p className="text-xs text-muted-foreground">
                                        No modo <strong>Personalizado</strong>, o escopo não se aplica (você escolhe um módulo específico).
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Modos */}
            <TooltipProvider delayDuration={200}>
                <div className="grid gap-4 md:grid-cols-2">
                    {MODOS.map((m) => {
                        const isSelected = modo === m.id
                        const isUti = m.id === 'mais_errados'

                        return (
                            <Tooltip key={m.id}>
                                <TooltipTrigger asChild>
                                    <Card
                                        role="button"
                                        tabIndex={0}
                                        className={`cursor-pointer transition hover:border-primary ${isUti ? 'md:col-span-2' : ''
                                            } ${isSelected ? 'border-primary shadow-md' : ''}`}
                                        onClick={() => onSelectMode(m.id)}
                                        onKeyDown={(e) => handleKeyDown(e, m.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-center gap-2 text-center text-lg">
                                                <span>{m.title}</span>
                                                <span className="text-muted-foreground">
                                                    <Info className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            </CardTitle>
                                            <CardDescription className="text-center">{m.desc}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-xs p-3">
                                    <div className="space-y-2 text-sm">
                                        {m.tooltip.map((t, i) => (
                                            <p key={i}>{t}</p>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </TooltipProvider>
        </div>
    )
}
