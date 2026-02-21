'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { Info, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricCardVariant =
  | 'default'
  | 'time'
  | 'questions'
  | 'accuracy'
  | 'flashcards'

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  variant?: MetricCardVariant
  trend?: {
    value: string
    isPositive: boolean
  }
  showProgressCircle?: boolean
  progressValue?: number
  tooltip?: string | string[]
}

const variantStyles: Record<MetricCardVariant, { icon: string }> = {
  default: {
    icon: 'bg-primary/10 text-primary',
  },
  time: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  questions: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  accuracy: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  flashcards: {
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
}

function ProgressCircle({ value, className }: { value: number; className?: string }) {
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const getColor = () => {
    if (value >= 80) return 'text-emerald-500'
    if (value >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className={cn('relative size-10 shrink-0', className)}>
      <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/50"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="2.5"
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none', getColor())}
        />
      </svg>
    </div>
  )
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trend,
  showProgressCircle = false,
  progressValue = 0,
  tooltip,
}: MetricCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className="group relative overflow-hidden transition-colors duration-200 motion-reduce:transition-none hover:shadow-md">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="metric-label truncate" title={label}>{label}</span>
              {tooltip && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm space-y-1">
                        {Array.isArray(tooltip) ? tooltip.map((p, i) => <p key={i}>{p}</p>) : <p>{tooltip}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Value */}
            <p className="metric-value">{value}</p>

            {/* Trend or subtext */}
            {trend ? (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{trend.value}</span>
              </div>
            ) : subtext ? (
              <p className="text-muted-foreground text-sm mt-2">{subtext}</p>
            ) : null}
          </div>

          {/* Icon area */}
          {showProgressCircle ? (
            <ProgressCircle value={progressValue} />
          ) : Icon ? (
            <div className={cn(
              'flex items-center justify-center size-10 rounded-xl shrink-0 transition-colors duration-200 motion-reduce:transition-none',
              styles.icon
            )}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
