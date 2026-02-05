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

export type MetricVariant = 'default' | 'time' | 'classTime' | 'exerciseTime' | 'questions' | 'accuracy' | 'flashcards'

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
  trendPositiveBg: string
  trendPositiveText: string
  trendNegativeBg: string
  trendNegativeText: string
  accentFrom: string
  accentTo: string
  hoverShadow: string
}> = {
  default: {
    iconBg: 'bg-linear-to-br from-primary to-primary/80',
    iconColor: 'text-primary-foreground',
    progressColor: 'text-primary',
    progressStroke: 'stroke-primary',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-primary/60',
    accentTo: 'to-primary/20',
    hoverShadow: 'hover:shadow-primary/5',
  },
  time: {
    iconBg: 'bg-linear-to-br from-blue-500 to-indigo-500',
    iconColor: 'text-white',
    progressColor: 'text-indigo-600 dark:text-blue-400',
    progressStroke: 'stroke-indigo-500',
    trendPositiveBg: 'bg-blue-500/10',
    trendPositiveText: 'text-blue-600 dark:text-blue-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-blue-400',
    accentTo: 'to-indigo-500',
    hoverShadow: 'hover:shadow-indigo-500/8',
  },
  classTime: {
    iconBg: 'bg-linear-to-br from-cyan-500 to-teal-500',
    iconColor: 'text-white',
    progressColor: 'text-teal-600 dark:text-cyan-400',
    progressStroke: 'stroke-teal-500',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-cyan-400',
    accentTo: 'to-blue-500',
    hoverShadow: 'hover:shadow-teal-500/8',
  },
  exerciseTime: {
    iconBg: 'bg-linear-to-br from-orange-500 to-rose-500',
    iconColor: 'text-white',
    progressColor: 'text-rose-600 dark:text-orange-400',
    progressStroke: 'stroke-rose-500',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-orange-400',
    accentTo: 'to-rose-500',
    hoverShadow: 'hover:shadow-rose-500/8',
  },
  questions: {
    iconBg: 'bg-linear-to-br from-emerald-500 to-teal-500',
    iconColor: 'text-white',
    progressColor: 'text-emerald-600 dark:text-emerald-400',
    progressStroke: 'stroke-emerald-500',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-emerald-400',
    accentTo: 'to-cyan-500',
    hoverShadow: 'hover:shadow-emerald-500/8',
  },
  accuracy: {
    iconBg: 'bg-linear-to-br from-amber-500 to-orange-500',
    iconColor: 'text-white',
    progressColor: 'text-amber-600 dark:text-amber-400',
    progressStroke: 'stroke-amber-500',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-amber-400',
    accentTo: 'to-rose-500',
    hoverShadow: 'hover:shadow-amber-500/8',
  },
  flashcards: {
    iconBg: 'bg-linear-to-br from-violet-500 to-fuchsia-500',
    iconColor: 'text-white',
    progressColor: 'text-fuchsia-600 dark:text-violet-400',
    progressStroke: 'stroke-fuchsia-500',
    trendPositiveBg: 'bg-emerald-500/10',
    trendPositiveText: 'text-emerald-600 dark:text-emerald-400',
    trendNegativeBg: 'bg-rose-500/10',
    trendNegativeText: 'text-rose-600 dark:text-rose-400',
    accentFrom: 'from-violet-400',
    accentTo: 'to-fuchsia-500',
    hoverShadow: 'hover:shadow-fuchsia-500/8',
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
    <Card className={cn(
      'group overflow-hidden transition-all duration-300 py-0 gap-0 rounded-2xl',
      'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5',
      'hover:shadow-lg',
      config.hoverShadow,
    )}>
      {/* Accent gradient bar */}
      <div className={cn(
        'h-0.5 bg-linear-to-r',
        config.accentFrom,
        config.accentTo,
      )} />

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
              'flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
              config.iconBg
            )}>
              <Icon className={cn('h-4 w-4 md:h-[18px] md:w-[18px]', config.iconColor)} />
            </div>
          </div>
        </div>

        {/* Value Area */}
        <div className="flex items-end justify-between min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">{value}</span>
            {subtext && (
              <span className="text-xs text-muted-foreground">{subtext}</span>
            )}
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1 text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full w-fit',
                trend.isPositive ? config.trendPositiveBg : config.trendNegativeBg,
                trend.isPositive ? config.trendPositiveText : config.trendNegativeText
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
