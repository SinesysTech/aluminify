'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  // Para o caso especial do card de Aproveitamento
  showProgressCircle?: boolean
  progressValue?: number // 0-100 para o cÃ­rculo de progresso
  tooltip?: string | string[] // Texto explicativo do tooltip (string Ãºnica ou array de parÃ¡grafos)
}

/**
 * Componente de CÃ­rculo de Progresso SVG (usado no card de Aproveitamento)
 */
function ProgressCircle({ value }: { value: number }) {
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative size-6 sm:size-7 md:size-8 shrink-0">
      <svg className="size-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        {/* CÃ­rculo de fundo */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
        />
        {/* CÃ­rculo de progresso */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="3"
          transform="rotate(-90 18 18)"
          className="text-emerald-400"
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
  trend,
  showProgressCircle = false,
  progressValue = 0,
  tooltip,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground min-w-0 flex-1 overflow-hidden">
              {showProgressCircle ? (
                <div className="shrink-0">
                  <ProgressCircle value={progressValue} />
                </div>
              ) : Icon ? (
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              ) : null}
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium break-words leading-tight">
                  {label}
                </p>
                {tooltip && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                          aria-label={`InformaÃ§Ãµes sobre ${label}`}
                        >
                          <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="start"
                        className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-sm">
                          {Array.isArray(tooltip) ? (
                            tooltip.map((paragraph, index) => (
                              <p key={index}>{paragraph}</p>
                            ))
                          ) : (
                            <p>{tooltip}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
          <p className="text-foreground tracking-tight text-xl sm:text-2xl lg:text-3xl font-bold break-words leading-none">
            {value}
          </p>
          {trend ? (
            <p
              className={cn(
                'text-xs sm:text-sm font-medium leading-tight',
                trend.isPositive
                  ? 'text-emerald-500'
                  : 'text-red-400'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </p>
          ) : subtext ? (
            <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-tight">
              {subtext}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs sm:text-sm font-medium invisible">
              Placeholder
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

