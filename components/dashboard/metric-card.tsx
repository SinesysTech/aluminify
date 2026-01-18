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
  showProgressCircle?: boolean
  progressValue?: number
  tooltip?: string | string[]
}

function ProgressCircle({ value }: { value: number }) {
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative size-5 shrink-0">
      <svg className="size-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
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
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
          {showProgressCircle ? (
            <ProgressCircle value={progressValue} />
          ) : Icon ? (
            <Icon className="h-4 w-4 shrink-0" />
          ) : null}
          <span className="text-xs font-medium truncate">{label}</span>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label={`Info sobre ${label}`}
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs">
                    {Array.isArray(tooltip) ? tooltip.map((p, i) => <p key={i}>{p}</p>) : <p>{tooltip}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-foreground text-xl font-bold leading-none">{value}</p>
        {trend ? (
          <p className={cn('text-[11px] mt-0.5', trend.isPositive ? 'text-emerald-500' : 'text-red-400')}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </p>
        ) : subtext ? (
          <p className="text-muted-foreground text-[11px] mt-0.5">{subtext}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
