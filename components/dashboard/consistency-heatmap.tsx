'use client'

import type { HeatmapDay } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
}

export function ConsistencyHeatmap({ data }: ConsistencyHeatmapProps) {
  // Função para determinar a classe de cor baseada na intensidade
  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-slate-200 dark:bg-slate-800'
      case 1:
        return 'bg-green-100 dark:bg-green-900/30'
      case 2:
        return 'bg-green-200 dark:bg-green-900/40'
      case 3:
        return 'bg-green-400 dark:bg-green-800'
      case 4:
        return 'bg-green-600 dark:bg-green-600'
      default:
        return 'bg-slate-200 dark:bg-slate-800'
    }
  }

  return (
    <Card className="mb-8">
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <h2 className="text-slate-900 dark:text-slate-50 text-base md:text-lg font-semibold mb-4 md:mb-6">
          Constância de Estudo
        </h2>
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1 min-w-max">
              {data.map((day, index) => (
                <div
                  key={`${day.date}-${index}`}
                  className={cn(
                    'aspect-square rounded-[2px]',
                    getIntensityClass(day.intensity)
                  )}
                  title={`${day.date} - Intensidade: ${day.intensity}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}





