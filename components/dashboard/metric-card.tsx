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
    <div className="relative size-8">
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
      <CardContent className="pt-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              {showProgressCircle ? (
                <ProgressCircle value={progressValue} />
              ) : Icon ? (
                <Icon className="text-lg" size={18} />
              ) : null}
              <p className="text-base font-medium">{label}</p>
            </div>
          </div>
          <p className="text-slate-900 dark:text-slate-50 tracking-tight text-3xl font-bold">
            {value}
          </p>
          {trend ? (
            <p
              className={cn(
                'text-sm font-medium',
                trend.isPositive
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </p>
          ) : subtext ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {subtext}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium invisible">
              Placeholder
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}





