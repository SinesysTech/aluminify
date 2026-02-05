'use client'

import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/app/shared/components/feedback/progress'
import { cn } from '@/lib/utils'
import { FrenteComModulos } from '../types'

export type FrenteColorConfig = {
  accent: string
  bar: string
  text: string
  hover: string
  ring: string
  expand: string
  border: string
}

interface FrenteCardProps {
  frente: FrenteComModulos
  stats: { completed: number; total: number }
  isExpanded: boolean
  onToggle: () => void
  colorConfig: FrenteColorConfig
  className?: string
}

export function FrenteCard({
  frente,
  stats,
  isExpanded,
  onToggle,
  colorConfig,
  className,
}: FrenteCardProps) {
  const { completed, total } = stats
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = total > 0 && completed === total

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 rounded-2xl pt-0 overflow-hidden',
        'hover:shadow-md',
        colorConfig.hover,
        'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5',
        isExpanded && ['ring-2', colorConfig.ring],
        isComplete && 'bg-emerald-500/5 border-emerald-500/30',
        className
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-expanded={isExpanded}
      aria-label={`Frente ${frente.nome}, ${completed} de ${total} atividades concluídas`}
    >
      <div className={cn(
        'h-0.5 bg-linear-to-r transition-colors',
        isComplete ? 'from-emerald-400 to-teal-500' : colorConfig.accent
      )} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <h4 className="font-semibold truncate" title={frente.nome}>
                {frente.nome}
              </h4>
            </div>

            {/* Progress bar */}
            <Progress
              value={percentage}
              className={cn(
                'h-2 mb-2',
                isComplete ? '[&>div]:bg-emerald-500' : colorConfig.bar
              )}
            />

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completed}/{total} atividades
              </span>
              <span className={cn(
                'font-medium tabular-nums',
                isComplete ? 'text-emerald-600 dark:text-emerald-400' : colorConfig.text
              )}>
                {percentage}%
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-muted/50 group-hover:bg-muted transition-colors',
            isExpanded && colorConfig.expand
          )}>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
