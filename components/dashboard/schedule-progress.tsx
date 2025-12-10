'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ScheduleProgressProps {
  value: number // 0-100
}

export function ScheduleProgress({ value }: ScheduleProgressProps) {
  // Determinar cor baseada no valor
  const getColorClass = () => {
    if (value < 30) {
      return 'bg-red-500 dark:bg-red-500'
    }
    if (value < 70) {
      return 'bg-yellow-500 dark:bg-yellow-500'
    }
    return 'bg-green-500 dark:bg-green-500'
  }

  const getTextColor = () => {
    if (value < 30) {
      return 'text-red-500'
    }
    if (value < 70) {
      return 'text-yellow-500'
    }
    return 'text-green-500'
  }

  return (
    <Card className="mb-8">
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-slate-900 dark:text-slate-50 text-base md:text-lg font-semibold">
              Progresso do Cronograma
            </h2>
            <span className={cn('text-base md:text-lg font-bold shrink-0', getTextColor())}>
              {value}%
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Você completou {value}% do cronograma previsto.
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={cn('h-2.5 rounded-full transition-all', getColorClass())}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

