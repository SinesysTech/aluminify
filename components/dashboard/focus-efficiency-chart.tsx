'use client'

import type { FocusEfficiencyDay } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FocusEfficiencyChartProps {
  data: FocusEfficiencyDay[]
}

export function FocusEfficiencyChart({ data }: FocusEfficiencyChartProps) {
  // Encontrar o valor máximo para normalizar as alturas
  const maxGrossTime = Math.max(...data.map((day) => day.grossTime))
  const maxNetTime = Math.max(...data.map((day) => day.netTime))
  const maxTime = Math.max(maxGrossTime, maxNetTime)

  // Função para calcular a porcentagem de altura
  const getHeightPercentage = (time: number) => {
    return maxTime > 0 ? (time / maxTime) * 100 : 0
  }

  // Função para formatar minutos em horas e minutos
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) {
      return `${mins}m`
    }
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}m`
  }

  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <h2 className="text-slate-900 dark:text-slate-50 text-base md:text-lg font-semibold">
            Eficiência de Foco
          </h2>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  aria-label="Informações sobre eficiência de foco"
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
                    Este gráfico compara o tempo bruto (total que você iniciou uma sessão de estudo) com o tempo líquido
                    (tempo efetivamente estudado, descontando pausas).
                  </p>
                  <p>
                    A barra cinza mostra o tempo bruto e a barra colorida mostra o tempo líquido.
                  </p>
                  <p>
                    Quanto maior a proporção do tempo líquido em relação ao bruto, maior sua eficiência de foco.
                  </p>
                  <p>
                    Isso ajuda a identificar em quais dias da semana você está mais focado.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="h-64 w-full pt-4">
          <div className="flex h-full items-end justify-between gap-2">
            {data.map((day, index) => {
              const grossHeight = getHeightPercentage(day.grossTime)
              void getHeightPercentage(day.netTime) // netHeight calculation kept for potential future use
              // Calcular a porcentagem do tempo líquido em relação ao bruto
              const netPercentage = day.grossTime > 0 
                ? (day.netTime / day.grossTime) * 100 
                : 0

              return (
                <div
                  key={index}
                  className="flex h-full w-full flex-col items-center justify-end gap-2"
                >
                  <div className="relative flex h-full w-full items-end gap-1 justify-center">
                    {/* Barra de Tempo Bruto (Cinza) */}
                    <div
                      className="relative w-4 rounded-t bg-slate-300 dark:bg-slate-700"
                      style={{ height: `${grossHeight}%` }}
                      title={`${day.day}: Tempo Bruto ${formatTime(day.grossTime)}`}
                    >
                      {/* Barra de Tempo Líquido (Primary) */}
                      <div
                        className={cn(
                          'absolute bottom-0 w-full rounded-t bg-primary transition-all'
                        )}
                        style={{ height: `${netPercentage}%` }}
                        title={`${day.day}: Tempo Líquido ${formatTime(day.netTime)} (${Math.round(netPercentage)}% eficiência)`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Tempo Bruto
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Tempo Líquido
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

