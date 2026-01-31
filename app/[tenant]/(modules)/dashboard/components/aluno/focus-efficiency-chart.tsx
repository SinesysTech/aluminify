'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Info } from 'lucide-react'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { useTheme } from 'next-themes'
import type { FocusEfficiencyDay } from '../../types'

interface FocusEfficiencyChartProps {
  data: FocusEfficiencyDay[]
}

export function FocusEfficiencyChart({ data }: FocusEfficiencyChartProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark' || theme === 'dark'

  // Cores adaptáveis ao tema
  const axisColor = useMemo(() => {
    return isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)'
  }, [isDark])

  return (
    <Card className="h-full overflow-hidden transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="widget-title">
            Eficiência de Foco
          </CardTitle>
          <TooltipProvider delayDuration={200}>
            <UiTooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Compara o tempo total da sessão (bruto) com o tempo real de estudo (líquido),
                  descontando pausas. Barras mais próximas indicam maior eficiência.
                </p>
              </TooltipContent>
            </UiTooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="day"
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisColor }}
              />
              <YAxis
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}min`}
                tick={{ fill: axisColor }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Tempo Bruto
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value} min
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Tempo Líquido
                            </span>
                            <span className="font-bold text-primary">
                              {payload[1].value} min
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="grossTime"
                name="Tempo Bruto"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-muted"
                maxBarSize={40}
              />
              <Bar
                dataKey="netTime"
                name="Tempo Líquido"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted shrink-0" />
            <span>Tempo Bruto (Sessão total)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary shrink-0" />
            <span>Tempo Líquido (Sem pausas)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
