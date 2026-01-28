'use client'

import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/app/shared/components/feedback/progress'
import { cn } from '@/lib/utils'
import { FrenteComModulos } from '../types'

interface FrenteCardProps {
  frente: FrenteComModulos
  stats: { completed: number; total: number }
  isExpanded: boolean
  onToggle: () => void
  className?: string
}

export function FrenteCard({
  frente,
  stats,
  isExpanded,
  onToggle,
  className,
}: FrenteCardProps) {
  const { completed, total } = stats
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = total > 0 && completed === total

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        isExpanded && 'ring-2 ring-primary/20 border-primary/40',
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
      aria-label={`Frente ${frente.nome}, ${completed} de ${total} atividades concluidas`}
    >
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
                isComplete && '[&>div]:bg-emerald-500'
              )}
            />

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completed}/{total} atividades
              </span>
              <span className={cn(
                'font-medium tabular-nums',
                isComplete ? 'text-emerald-600' : 'text-foreground'
              )}>
                {percentage}%
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-muted/50 group-hover:bg-muted transition-colors',
            isExpanded && 'bg-primary/10'
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
