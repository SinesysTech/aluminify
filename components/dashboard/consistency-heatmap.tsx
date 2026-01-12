'use client'

import { useState } from 'react'
import type { HeatmapDay } from '@/types/dashboard'
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

  // Função para determinar a classe de cor baseada na intensidade
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

  // Calcular número de colunas baseado no período
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
    <Card className="mb-8">
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-base md:text-lg font-semibold">
              Constância de Estudo
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre constância de estudo"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2 text-sm">
                    <p>
                      Este gráfico mostra sua frequência de estudo ao longo do tempo. Cada quadrado representa um dia,
                      e a intensidade da cor indica quanto tempo você estudou naquele dia.
                    </p>
                    <p>
                      Cores mais escuras significam mais tempo de estudo.
                    </p>
                    <p>
                      Você pode alternar entre visualização semanal, mensal ou anual para ver diferentes períodos.
                    </p>
                    <p>
                      Manter uma constância regular é fundamental para o aprendizado eficaz.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 'semanal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('semanal')}
              className="text-xs"
            >
              Semanal
            </Button>
            <Button
              variant={period === 'mensal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('mensal')}
              className="text-xs"
            >
              Mensal
            </Button>
            <Button
              variant={period === 'anual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('anual')}
              className="text-xs"
            >
              Anual
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
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
        </div>
      </CardContent>
    </Card>
  )
}






