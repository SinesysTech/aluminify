'use client'

import type { SubjectDistributionItem } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface SubjectDistributionProps {
  data: SubjectDistributionItem[]
  totalHours?: number // Total de horas para exibir no centro
}

export function SubjectDistribution({
  data,
  totalHours = 42,
}: SubjectDistributionProps) {
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius

  // Pre-compute offsets to avoid mutation during render
  const itemsWithOffsets = data.map((item, index) => {
    const previousItems = data.slice(0, index)
    const offset = previousItems.reduce((acc, prev) => acc + (prev.percentage / 100) * circumference, 0)
    return { item, offset }
  })

  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <h2 className="text-foreground text-base md:text-lg font-semibold">
            Distribuição por Disciplina
          </h2>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  aria-label="Informações sobre distribuição por disciplina"
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
                    Este gráfico mostra como seu tempo de estudo está distribuído entre as diferentes disciplinas.
                  </p>
                  <p>
                    Cada cor representa uma disciplina e o tamanho do segmento indica a porcentagem do tempo total
                    dedicado a ela.
                  </p>
                  <p>
                    O número no centro mostra o total de horas estudadas.
                  </p>
                  <p>
                    Uma distribuição equilibrada ajuda a manter um bom desempenho em todas as áreas.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-1 items-center justify-center py-4">
          <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              {/* Círculo de fundo */}
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              {/* Segmentos do gráfico */}
              {itemsWithOffsets.map(({ item, offset }, index) => {
                const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`

                return (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeDasharray={dashArray}
                    strokeDashoffset={-offset}
                    strokeWidth="4"
                    transform="rotate(-90 18 18)"
                  />
                )
              })}
            </svg>
            {/* Texto central */}
            <div className="absolute flex flex-col items-center">
              <span className="text-muted-foreground text-sm">
                Total
              </span>
              <span className="text-foreground text-xl font-bold">
                {totalHours}h
              </span>
            </div>
          </div>
        </div>
        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name} - {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}






