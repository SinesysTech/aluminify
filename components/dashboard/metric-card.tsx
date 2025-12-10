'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  progressValue?: number // 0-100 para o círculo de progresso
}

/**
 * Componente de Círculo de Progresso SVG (usado no card de Aproveitamento)
 */
function ProgressCircle({ value }: { value: number }) {
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative size-6 sm:size-7 md:size-8 shrink-0">
      <svg className="size-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        {/* Círculo de fundo */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Círculo de progresso */}
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
          className="text-green-500"
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
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 min-w-0">
          <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 min-w-0">
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 text-slate-600 dark:text-slate-400 min-w-0 flex-1 overflow-hidden">
              {showProgressCircle ? (
                <div className="shrink-0">
                  <ProgressCircle value={progressValue} />
                </div>
              ) : Icon ? (
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-[18px] lg:w-[18px] shrink-0" />
              ) : null}
              <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-medium break-words leading-tight hyphens-auto">
                {label}
              </p>
            </div>
          </div>
          <p className="text-slate-900 dark:text-slate-50 tracking-tight text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words leading-none">
            {value}
          </p>
          {trend ? (
            <p
              className={cn(
                'text-[10px] sm:text-xs md:text-sm font-medium break-words leading-tight',
                trend.isPositive
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </p>
          ) : subtext ? (
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium break-words leading-tight">
              {subtext}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium invisible">
              Placeholder
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}





