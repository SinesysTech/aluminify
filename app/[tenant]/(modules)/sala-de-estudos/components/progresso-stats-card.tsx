'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  CheckCircle2,
  Circle,
  PlayCircle,
  Target,
  Flame,
  Sparkles,
} from 'lucide-react'
import { Progress } from '@/app/shared/components/feedback/progress'
import { cn } from '@/lib/utils'
import { AtividadeComProgresso } from '../types'

interface ProgressoStatsCardProps {
  atividades: AtividadeComProgresso[]
  streakDays?: number
  dailyGoal?: { completed: number; target: number }
  className?: string
}

export function ProgressoStatsCard({
  atividades,
  streakDays = 0,
  dailyGoal,
  className,
}: ProgressoStatsCardProps) {
  const stats = React.useMemo(() => {
    const total = atividades.length
    const pendentes = atividades.filter(
      (a) => !a.progressoStatus || a.progressoStatus === 'Pendente'
    ).length
    const iniciadas = atividades.filter((a) => a.progressoStatus === 'Iniciado').length
    const concluidas = atividades.filter((a) => a.progressoStatus === 'Concluido').length
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

    return {
      total,
      pendentes,
      iniciadas,
      concluidas,
      percentual,
    }
  }, [atividades])

  const streakIntensity = React.useMemo(() => {
    if (streakDays === 0) return 'text-muted-foreground'
    if (streakDays < 3) return 'text-orange-400'
    if (streakDays < 7) return 'text-orange-500'
    if (streakDays < 14) return 'text-amber-500'
    return 'text-amber-400'
  }, [streakDays])

  const motivationalMessage = React.useMemo(() => {
    if (stats.percentual === 100) return 'Incrivel! Voce completou tudo!'
    if (stats.percentual >= 75) return 'Quase la! Continue assim!'
    if (stats.percentual >= 50) return 'Mais da metade! Voce consegue!'
    if (stats.percentual >= 25) return 'Bom comeco! Mantenha o ritmo!'
    if (stats.concluidas > 0) return 'Otimo inicio! Cada passo conta!'
    return 'Comece sua jornada de estudos!'
  }, [stats.percentual, stats.concluidas])

  const effectiveDailyGoal = dailyGoal || { completed: 0, target: 3 }
  const dailyProgress = Math.min(
    100,
    Math.round((effectiveDailyGoal.completed / effectiveDailyGoal.target) * 100)
  )
  const dailyGoalComplete = effectiveDailyGoal.completed >= effectiveDailyGoal.target

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 md:p-6">
        {/* Top Row: Streak + Daily Goal + Motivational Message */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          {/* Streak Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl shrink-0',
              'bg-linear-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10',
              'border border-orange-500/20'
            )}
          >
            <div className="relative">
              <Flame
                className={cn('h-5 w-5', streakIntensity)}
                fill="currentColor"
              />
              {streakDays >= 7 && (
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={cn('text-sm font-bold leading-tight', streakIntensity)}>
                {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                sequencia
              </span>
            </div>
          </div>

          {/* Daily Goal */}
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl shrink-0',
              dailyGoalComplete
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-primary/5 border border-primary/10'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                dailyGoalComplete ? 'bg-emerald-500/20' : 'bg-primary/10'
              )}
            >
              <Target
                className={cn(
                  'h-4 w-4',
                  dailyGoalComplete ? 'text-emerald-500' : 'text-primary'
                )}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-sm font-bold leading-tight',
                  dailyGoalComplete ? 'text-emerald-600' : 'text-foreground'
                )}
              >
                {effectiveDailyGoal.completed}/{effectiveDailyGoal.target} hoje
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {dailyGoalComplete ? 'Meta atingida!' : 'meta diaria'}
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  dailyGoalComplete ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>

          {/* Motivational Message */}
          <div className="flex-1 text-sm text-muted-foreground italic hidden md:flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            {motivationalMessage}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.pendentes}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Circle className="h-3 w-3" />
              Pendentes
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/5">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.iniciadas}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <PlayCircle className="h-3 w-3 text-blue-500" />
              Iniciadas
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/5">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.concluidas}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Concluidas
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-semibold">{stats.percentual}%</span>
          </div>
          <Progress
            value={stats.percentual}
            className={cn(
              'h-2.5',
              stats.percentual === 100 && '[&>div]:bg-emerald-500'
            )}
          />
        </div>

        {/* Mobile Motivational Message */}
        <div className="mt-4 text-sm text-muted-foreground italic flex items-center md:hidden">
          <TrendingUp className="h-4 w-4 mr-2 text-primary" />
          {motivationalMessage}
        </div>
      </CardContent>
    </Card>
  )
}
