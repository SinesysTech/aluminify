import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'
import { cn } from '@/app/shared/library/utils'

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
  tooltip?: string[] // Array de parágrafos para o tooltip
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
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6 relative">
        {tooltip && (
          <div className="absolute top-3 right-3">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  align="end" 
                  className="max-w-[280px] p-4 text-sm bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 shadow-xl z-50"
                  sideOffset={4}
                >
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-100 border-b border-slate-700 pb-2">{label}</p>
                    <div className="space-y-2 text-slate-300">
                      {tooltip.map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="flex items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {subtext && (
              <span className="text-xs text-muted-foreground">{subtext}</span>
            )}
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {showProgressCircle && (
            <div className="relative h-12 w-12">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Circle */}
                <path
                  className="text-muted"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                {/* Progress Circle */}
                <path
                  className="text-primary transition-all duration-500 ease-in-out"
                  strokeDasharray={`${progressValue}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                {progressValue}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
