'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/app/shared/library/utils'

interface ScheduleProgressProps {
  value: number // 0-100
}

export function ScheduleProgress({ value }: ScheduleProgressProps) {
  // Determinar cor baseada no valor
  const getColorClass = () => {
    if (value < 30) {
      return 'bg-rose-400'
    }
    if (value < 70) {
      return 'bg-amber-400'
    }
    return 'bg-emerald-400'
  }

  const getTextColor = () => {
    if (value < 30) {
      return 'text-rose-400'
    }
    if (value < 70) {
      return 'text-amber-400'
    }
    return 'text-emerald-400'
  }

  return (
    <Card className="mb-8 rounded-2xl dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5">
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="widget-title">
                Progresso do Cronograma
              </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre o progresso do cronograma"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs bg-popover text-popover-foreground border-border p-3 z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2 text-sm">
                    <p>
                      Este indicador mostra o percentual de aulas do seu cronograma que você já completou.
                    </p>
                    <p>
                      O cálculo considera todas as aulas previstas no seu cronograma de estudos e quantas
                      delas você já marcou como concluídas.
                    </p>
                    <p>
                      Quanto maior o percentual, mais próximo você está de finalizar todo o conteúdo planejado.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
            <span className={cn('text-base md:text-lg font-bold shrink-0', getTextColor())}>
              {value}%
            </span>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Você completou {value}% do cronograma previsto.
          </p>
          <div className="w-full bg-muted rounded-full h-2.5">
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

