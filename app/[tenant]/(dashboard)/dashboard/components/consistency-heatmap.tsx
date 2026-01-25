'use client'

import { useState } from 'react'
import type { HeatmapDay } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeatmapPeriod = 'semanal' | 'mensal' | 'anual'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
  period?: HeatmapPeriod
  onPeriodChange?: (period: HeatmapPeriod) => void
}

export function ConsistencyHeatmap({
  data,
  period: externalPeriod,
  onPeriodChange
}: ConsistencyHeatmapProps) {
  const [internalPeriod, setInternalPeriod] = useState<HeatmapPeriod>('anual')
  const period = externalPeriod ?? internalPeriod

  const handlePeriodChange = (newPeriod: HeatmapPeriod) => {
    if (!externalPeriod) {
      setInternalPeriod(newPeriod)
    }
    onPeriodChange?.(newPeriod)
  }

  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-muted'
      case 1:
        return 'bg-green-100 dark:bg-green-900/30'
      case 2:
        return 'bg-green-200 dark:bg-green-900/40'
      case 3:
        return 'bg-green-400 dark:bg-green-800'
      case 4:
        return 'bg-green-600 dark:bg-green-600'
      default:
        return 'bg-muted'
    }
  }

  const getGridCols = () => {
    switch (period) {
      case 'semanal':
        return 'grid-cols-7'
      case 'mensal':
        return 'grid-cols-[repeat(31,minmax(0,1fr))]'
      case 'anual':
        return 'grid-cols-[repeat(53,minmax(0,1fr))]'
      default:
        return 'grid-cols-[repeat(53,minmax(0,1fr))]'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Constância de Estudo</h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="start" className="max-w-xs">
                  <div className="space-y-2 text-sm">
                    <p>
                      Este gráfico mostra sua frequência de estudo ao longo do tempo.
                    </p>
                    <p>
                      Cores mais escuras significam mais tempo de estudo.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-1">
            <Button
              variant={period === 'semanal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('semanal')}
              className="text-xs h-7 px-2.5"
            >
              Semanal
            </Button>
            <Button
              variant={period === 'mensal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('mensal')}
              className="text-xs h-7 px-2.5"
            >
              Mensal
            </Button>
            <Button
              variant={period === 'anual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('anual')}
              className="text-xs h-7 px-2.5"
            >
              Anual
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className={cn('grid gap-1 min-w-max', getGridCols())}>
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
      </CardContent>
    </Card>
  )
}
