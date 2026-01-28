'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Brain, Users, Flame, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FocusHeaderProps {
    presenceCount: number
    streak?: number
    todayMinutes?: number
    dailyGoal?: number
}

export function FocusHeader({
    presenceCount,
    streak = 0,
    todayMinutes = 0,
    dailyGoal = 120
}: FocusHeaderProps) {
    const goalProgress = dailyGoal > 0 ? Math.min((todayMinutes / dailyGoal) * 100, 100) : 0

    return (
        <div className="space-y-4">
            {/* Main header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
                        <Brain className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Modo Foco</h1>
                        <p className="text-muted-foreground mt-0.5">
                            Estudo imersivo para máxima concentração
                        </p>
                    </div>
                </div>

                {/* Presence indicator */}
                <Badge
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-normal"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{presenceCount} estudando agora</span>
                </Badge>
            </div>

            {/* Stats row - only show if we have data */}
            {(streak > 0 || todayMinutes > 0) && (
                <div className="flex items-center gap-4 pt-2">
                    {/* Streak */}
                    {streak > 0 && (
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                            streak >= 7 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                            streak >= 3 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-muted text-muted-foreground'
                        )}>
                            <Flame className={cn(
                                'h-4 w-4',
                                streak >= 7 && 'text-orange-500',
                                streak >= 3 && streak < 7 && 'text-amber-500'
                            )} />
                            <span className="font-medium">{streak} dias</span>
                            <span className="text-xs opacity-70">de sequência</span>
                        </div>
                    )}

                    {/* Today's progress */}
                    {dailyGoal > 0 && (
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Hoje:</span>
                                <span className="font-medium">{todayMinutes} min</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">{dailyGoal} min</span>
                            </div>
                            {/* Mini progress bar */}
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        goalProgress >= 100 ? 'bg-emerald-500' :
                                        goalProgress >= 50 ? 'bg-primary' :
                                        'bg-amber-500'
                                    )}
                                    style={{ width: `${goalProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
