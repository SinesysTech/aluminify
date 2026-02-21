'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Info, Clock } from 'lucide-react'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import type { SubjectDistributionItem, DashboardPeriod } from '../../types'

interface SubjectDistributionProps {
  data: SubjectDistributionItem[]
  period: DashboardPeriod
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: SubjectDistributionItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-lg">
        <p className="font-medium text-popover-foreground">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.percentage}% do tempo
        </p>
      </div>
    )
  }
  return null
}

// Paleta harmonizada com o tema emerald/green do card
const CHART_PALETTE = [
  '#059669', // emerald-600
  '#16a34a', // green-600
  '#0d9488', // teal-600
  '#0891b2', // cyan-600
  '#10b981', // emerald-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
]

export function SubjectDistribution({ data, period }: SubjectDistributionProps) {
  // Ordenar dados por porcentagem (maior para menor)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.percentage - a.percentage)
  }, [data])

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'semanal': return 'nesta semana'
      case 'mensal': return 'neste mês'
      case 'anual': return 'neste ano'
    }
  }, [period])

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-colors duration-200 motion-reduce:transition-none rounded-2xl pt-0 dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5">
      <div className="h-0.5 bg-linear-to-r from-emerald-400 to-green-500" />
      <CardContent className="p-4 md:p-5 flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-green-500">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="widget-title">Distribuição de Tempo</h3>
              <TooltipProvider delayDuration={200}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Mostra como seu tempo de estudo foi distribuído entre as matérias {periodLabel}.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">Proporção de tempo por matéria {periodLabel}</p>
          </div>
        </div>
        {sortedData.length > 0 ? (
          <>
            <div className="h-75 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  {/* eslint-disable @typescript-eslint/no-explicit-any */}
                  <Pie
                    data={sortedData as any}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {sortedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip as any} />
                  {/* eslint-enable @typescript-eslint/no-explicit-any */}
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {sortedData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} 
                    />
                    <span className="truncate max-w-30" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-medium text-muted-foreground">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <p className="text-sm">Sem dados de estudo {periodLabel}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
