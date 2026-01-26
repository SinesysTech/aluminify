'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { cn } from '@/app/shared/library/utils'
import { Info } from 'lucide-react'
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">
            Distribuição de Tempo
          </CardTitle>
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
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        {sortedData.length > 0 ? (
          <>
            <div className="h-[200px] w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedData}
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
                        fill={entry.color} 
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
              {sortedData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="truncate max-w-[120px]" title={item.name}>
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
