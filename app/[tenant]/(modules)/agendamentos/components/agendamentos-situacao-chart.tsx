'use client'

import { useMemo } from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AgendamentosStats = {
  pendentes: number
  confirmados: number
  cancelados: number
  concluidos?: number
}

type Props = {
  title?: string
  description?: string
  stats: AgendamentosStats
}

type ChartItem = {
  name: string
  value: number
  color: string
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: readonly { payload: ChartItem }[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium text-popover-foreground">{item.name}</p>
      <p className="text-sm text-muted-foreground">
        {item.value} ({formatPercent(item.value, total)})
      </p>
    </div>
  )
}

export function AgendamentosSituacaoChart({
  title = 'Situação gráfica',
  description,
  stats,
}: Props) {
  const data = useMemo<ChartItem[]>(() => {
    // Combine pendentes + confirmados as "Agendados" since appointments are now auto-confirmed
    const items: ChartItem[] = [
      { name: 'Agendados', value: stats.confirmados + stats.pendentes, color: 'var(--chart-1)' },
      { name: 'Cancelados', value: stats.cancelados, color: 'var(--chart-2)' },
      { name: 'Concluídos', value: stats.concluidos ?? 0, color: 'var(--chart-4)' },
    ]

    return items.filter((i) => i.value > 0)
  }, [stats])

  const total = useMemo(() => data.reduce((acc, cur) => acc + cur.value, 0), [data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {total > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-55 w-full">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <PieChart>
                  {/* eslint-disable @typescript-eslint/no-explicit-any */}
                  <Pie
                    data={data as any}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={(props: any) => <CustomTooltip {...props} total={total} />} />
                  {/* eslint-enable @typescript-eslint/no-explicit-any */}
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.value}</span>
                    <span className="text-muted-foreground">({formatPercent(item.value, total)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-10">
            <BarChart3 className="h-4 w-4" />
            <span>Sem dados para exibir no período.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
