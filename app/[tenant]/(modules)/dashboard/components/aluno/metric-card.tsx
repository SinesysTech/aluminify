'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import type { LucideIcon } from 'lucide-react'
import { Info, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricVariant = 'default' | 'time' | 'questions' | 'accuracy' | 'flashcards'

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  showProgressCircle?: boolean
  progressValue?: number
  tooltip?: string[]
  variant?: MetricVariant
}

// Configuração visual por variante
const variantConfig: Record<MetricVariant, {
  iconBg: string
  iconColor: string
  progressColor: string
  progressStroke: string
  trendPositive: string
  trendNegative: string
}> = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    progressColor: 'text-primary',
    progressStroke: 'stroke-primary',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  time: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    progressColor: 'text-blue-600 dark:text-blue-400',
    progressStroke: 'stroke-blue-500',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  questions: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressColor: 'text-emerald-600 dark:text-emerald-400',
    progressStroke: 'stroke-emerald-500',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  accuracy: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressColor: 'text-amber-600 dark:text-amber-400',
    progressStroke: 'stroke-amber-500',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  flashcards: {
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    progressColor: 'text-violet-600 dark:text-violet-400',
    progressStroke: 'stroke-violet-500',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  showProgressCircle,
  progressValue = 0,
  tooltip,
  variant = 'default',
}: MetricCardProps) {
  const config = variantConfig[variant]

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md py-0 gap-0">
      <CardContent className="p-4 md:p-5">
        {/* Header: Label + Icon */}
        <div className="flex items-start justify-between mb-2">
          <span className="metric-label leading-tight">{label}</span>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="end"
                    className="max-w-70 p-4 text-sm"
                    sideOffset={4}
                  >
                    <div className="space-y-3">
                      <p className="font-semibold border-b border-border pb-2">{label}</p>
                      <div className="space-y-2 text-muted-foreground">
                        {tooltip.map((paragraph, index) => (
                          <p key={index} className="leading-relaxed">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className={cn(
              'flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
              config.iconBg
            )}>
              <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', config.iconColor)} />
            </div>
          </div>
        </div>

        {/* Value Area */}
        <div className="flex items-end justify-between min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="metric-value truncate">{value}</span>
            {subtext && (
              <span className="text-xs text-muted-foreground">{subtext}</span>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium mt-1',
                trend.isPositive ? config.trendPositive : config.trendNegative
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>

          {/* Progress Circle */}
          {showProgressCircle && (
            <div className="relative h-14 w-14 md:h-16 md:w-16">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Circle */}
                <circle
                  className="stroke-muted/50"
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  strokeWidth="3"
                />
                {/* Progress Circle */}
                <circle
                  className={cn('transition-all duration-700 ease-out', config.progressStroke)}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={`${progressValue} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className={cn(
                'absolute inset-0 flex items-center justify-center text-xs md:text-sm font-bold',
                config.progressColor
              )}>
                {progressValue}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
