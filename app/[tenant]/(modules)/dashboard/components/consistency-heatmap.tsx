'use client'

import { useMemo, useState } from 'react'
import type { HeatmapDay } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/app/shared/library/utils'

export type HeatmapPeriod = 'semanal' | 'mensal' | 'anual'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
  period?: HeatmapPeriod
  onPeriodChange?: (period: HeatmapPeriod) => void
}

const DAY_LABELS = ['Seg', '', 'Qua', '', 'Sex', '', 'Dom']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getIntensityClass(intensity: number) {
  switch (intensity) {
    case 0:
      return 'bg-muted'
    case 1:
      return 'bg-green-200 dark:bg-green-900/40'
    case 2:
      return 'bg-green-300 dark:bg-green-800/60'
    case 3:
      return 'bg-green-400 dark:bg-green-700'
    case 4:
      return 'bg-green-600 dark:bg-green-500'
    default:
      return 'bg-muted'
  }
}

function getIntensityLabel(intensity: number) {
  switch (intensity) {
    case 0: return 'Sem atividade'
    case 1: return 'Pouca atividade'
    case 2: return 'Atividade moderada'
    case 3: return 'Boa atividade'
    case 4: return 'Atividade intensa'
    default: return ''
  }
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

  const getGridCols = () => {
    switch (period) {
      case 'semanal':
        return 'grid-cols-7'
      case 'mensal':
        return 'grid-cols-[repeat(31,minmax(0,1fr))]'
      case 'anual':
        return 'grid-cols-53'
      default:
        return 'grid-cols-53'
    }
  }

  // Calculate month label positions for the annual view
  const monthPositions = useMemo(() => {
    if (period !== 'anual' || data.length === 0) return []

    const positions: Array<{ label: string; col: number }> = []
    let lastMonth = -1

    for (let i = 0; i < data.length; i++) {
      const day = data[i]
      if (!day.date) continue
      const date = new Date(day.date + 'T00:00:00')
      const month = date.getMonth()
      if (month !== lastMonth) {
        const col = Math.floor(i / 7)
        positions.push({ label: MONTH_LABELS[month], col })
        lastMonth = month
      }
    }
    return positions
  }, [data, period])

  const showDayLabels = period === 'anual' || period === 'mensal'

  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
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
            {(['semanal', 'mensal', 'anual'] as HeatmapPeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                className="text-xs h-7 px-2.5"
              >
                {p === 'semanal' ? 'Semanal' : p === 'mensal' ? 'Mensal' : 'Anual'}
              </Button>
            ))}
          </div>
        </div>

        {/* Month labels for annual view */}
        {period === 'anual' && monthPositions.length > 0 && (
          <div className="overflow-x-auto mb-1">
            <div className="relative min-w-max" style={{ paddingLeft: showDayLabels ? '2rem' : 0 }}>
              <div className="grid grid-cols-53 gap-1">
                {Array.from({ length: 53 }).map((_, colIdx) => {
                  const match = monthPositions.find((m) => m.col === colIdx)
                  return (
                    <div key={colIdx} className="text-[10px] text-muted-foreground leading-none">
                      {match?.label ?? ''}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {/* Day-of-week labels */}
            {showDayLabels && (
              <div className="flex flex-col gap-1 mr-1.5 pt-0">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground leading-none flex items-center justify-end"
                    style={{ height: period === 'semanal' ? 16 : 11, width: '1.5rem' }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Grid cells */}
            <div className={cn('grid gap-1 flex-1', getGridCols())}>
              {data.map((day, index) => (
                <TooltipProvider key={`${day.date}-${index}`} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'aspect-square rounded-[2px] cursor-default transition-colors',
                          getIntensityClass(day.intensity)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{day.date}</p>
                      <p className="text-muted-foreground">{getIntensityLabel(day.intensity)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={cn(
                'size-3 rounded-[2px]',
                getIntensityClass(intensity)
              )}
            />
          ))}
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  )
}
