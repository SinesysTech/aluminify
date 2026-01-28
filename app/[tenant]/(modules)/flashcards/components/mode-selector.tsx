'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/app/shared/components/forms/checkbox'
import { Label } from '@/app/shared/components/forms/label'
import {
    Flame,
    BookOpen,
    Brain,
    HeartPulse,
    Target,
    Info,
    type LucideIcon,
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { MODOS, type ModoConfig } from '../types'
import { cn } from '@/lib/utils'

const iconMap: Record<ModoConfig['icon'], LucideIcon> = {
    flame: Flame,
    'book-open': BookOpen,
    brain: Brain,
    'heart-pulse': HeartPulse,
    target: Target,
}

interface ModeSelectorProps {
    modo?: string | null
    scope: 'all' | 'completed'
    onSelectMode: (modeId: string) => void
    onScopeChange: (scope: 'all' | 'completed') => void
    isLoading?: boolean
}

function ModeCard({
    mode,
    isSelected,
    onSelect,
    isHighlighted = false,
}: {
    mode: ModoConfig
    isSelected: boolean
    onSelect: () => void
    isHighlighted?: boolean
}) {
    const Icon = iconMap[mode.icon]

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card
                    role="button"
                    tabIndex={0}
                    onClick={onSelect}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelect()
                        }
                    }}
                    className={cn(
                        'group relative cursor-pointer overflow-hidden transition-all duration-200',
                        'border-2 bg-card/50 backdrop-blur-sm',
                        mode.accent,
                        isSelected
                            ? 'ring-2 ring-primary/20 shadow-lg scale-[1.02]'
                            : 'hover:shadow-md hover:scale-[1.01]',
                        isHighlighted && 'md:col-span-2'
                    )}
                >
                    {/* Gradient Background */}
                    <div
                        className={cn(
                            'absolute inset-0 bg-linear-to-br opacity-60 transition-opacity group-hover:opacity-100',
                            mode.gradient
                        )}
                    />

                    <CardHeader className="relative py-3 pb-1">
                        <div className={cn(
                            'flex items-center gap-2.5',
                            isHighlighted ? 'justify-center' : 'justify-start'
                        )}>
                            {/* Icon Container */}
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                                    mode.iconBg
                                )}
                            >
                                <Icon className="h-4 w-4" strokeWidth={2} />
                            </div>

                            <div className={cn(isHighlighted && 'text-center')}>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    {mode.title}
                                    <Info className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative pt-0 pb-3">
                        <CardDescription className={cn(
                            'text-xs leading-relaxed',
                            isHighlighted && 'text-center'
                        )}>
                            {mode.desc}
                        </CardDescription>
                    </CardContent>

                    {/* Selection Indicator */}
                    {isSelected && (
                        <div className="absolute right-2.5 top-2.5">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}
                </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="max-w-xs p-3">
                <div className="space-y-2 text-sm">
                    {mode.tooltip.map((t, i) => (
                        <p key={i}>{t}</p>
                    ))}
                </div>
            </TooltipContent>
        </Tooltip>
    )
}

export function ModeSelector({
    modo,
    scope,
    onSelectMode,
    onScopeChange,
    isLoading = false,
}: ModeSelectorProps) {
    // Separate UTI mode (highlighted) from others
    const utiMode = MODOS.find((m) => m.id === 'mais_errados')
    const otherModes = MODOS.filter((m) => m.id !== 'mais_errados')

    return (
        <div className="space-y-5">
            {/* Hero Header */}
            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Flashcards
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Estude de forma inteligente com repetição espaçada. Escolha um modo e comece sua sessão de revisão.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scope Selection Card */}
            <Card className="border-muted bg-muted/30">
                <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-baseline gap-1.5">
                            <Label className="text-sm font-medium whitespace-nowrap">Fonte dos flashcards</Label>
                            <span className="text-xs text-muted-foreground">
                                — escolha se a revisão considera todos os módulos ou apenas os concluídos
                            </span>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                            <label className="flex items-center gap-2 text-sm cursor-pointer group">
                                <Checkbox
                                    checked={scope === 'all'}
                                    onCheckedChange={(checked) => {
                                        if (checked) onScopeChange('all')
                                    }}
                                    disabled={isLoading || modo === 'personalizado'}
                                    aria-label="Todos os módulos do meu curso"
                                />
                                <span className="transition-colors group-hover:text-foreground whitespace-nowrap">
                                    Todos os módulos
                                </span>
                            </label>

                            <label className="flex items-center gap-2 text-sm cursor-pointer group">
                                <Checkbox
                                    checked={scope === 'completed'}
                                    onCheckedChange={(checked) => {
                                        if (checked) onScopeChange('completed')
                                    }}
                                    disabled={isLoading || modo === 'personalizado'}
                                    aria-label="Apenas módulos concluídos"
                                />
                                <span className="transition-colors group-hover:text-foreground whitespace-nowrap">
                                    Apenas concluídos
                                </span>
                            </label>
                        </div>
                    </div>

                    {modo === 'personalizado' && (
                        <p className="mt-2 text-xs text-muted-foreground border-t pt-2">
                            No modo <strong>Personalizado</strong>, você escolhe um módulo específico.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Mode Selection Grid */}
            <div className="space-y-3">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Escolha seu modo de estudo
                </h2>

                <TooltipProvider delayDuration={300}>
                    <div className="grid gap-3 md:grid-cols-2">
                        {/* UTI Mode - Highlighted */}
                        {utiMode && (
                            <ModeCard
                                mode={utiMode}
                                isSelected={modo === utiMode.id}
                                onSelect={() => onSelectMode(utiMode.id)}
                                isHighlighted
                            />
                        )}

                        {/* Other Modes */}
                        {otherModes.map((m) => (
                            <ModeCard
                                key={m.id}
                                mode={m}
                                isSelected={modo === m.id}
                                onSelect={() => onSelectMode(m.id)}
                            />
                        ))}
                    </div>
                </TooltipProvider>
            </div>
        </div>
    )
}
