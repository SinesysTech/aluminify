'use client'

import { useMemo } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts'
import { GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/dataviz/chart'
import type { DisciplinaPerformance } from '@/app/[tenant]/(modules)/dashboard/types'

interface DisciplineChartProps {
  disciplinas: DisciplinaPerformance[]
}

function getBarColor(score: number): string {
  if (score >= 80) return 'var(--color-emerald-500, #10b981)'
  if (score >= 60) return 'var(--color-amber-500, #f59e0b)'
  if (score >= 40) return 'var(--color-orange-500, #f97316)'
  return 'var(--color-red-500, #ef4444)'
}

export function DisciplineChart({ disciplinas }: DisciplineChartProps) {
  const chartData = useMemo(() => {
    return disciplinas
      .slice(0, 8)
      .sort((a, b) => b.aproveitamento - a.aproveitamento)
      .map((d) => ({
        name: d.name.length > 18 ? d.name.slice(0, 16) + '...' : d.name,
        fullName: d.name,
        aproveitamento: d.aproveitamento,
        alunos: d.alunosAtivos,
        questoes: d.totalQuestoes,
      }))
  }, [disciplinas])

  const chartConfig: ChartConfig = useMemo(
    () => ({
      aproveitamento: {
        label: 'Aproveitamento',
        color: 'var(--chart-1)',
      },
    }),
    []
  )

  const totalQuestoes = disciplinas.reduce((sum, d) => sum + d.totalQuestoes, 0)

  if (disciplinas.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle>Aproveitamento por Disciplina</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-muted/50">
            <GraduationCap className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Sem dados de aproveitamento
            </p>
            <p className="text-xs text-muted-foreground/70">
              Os dados aparecem quando alunos respondem questões nas disciplinas.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const barHeight = 40
  const chartHeight = Math.max(200, chartData.length * barHeight + 40)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Aproveitamento por Disciplina</CardTitle>
          <p className="text-xs text-muted-foreground">
            {disciplinas.length} {disciplinas.length === 1 ? 'disciplina' : 'disciplinas'} · {totalQuestoes.toLocaleString('pt-BR')} questões
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="space-y-1">
                        <p className="font-medium">{item.payload.fullName}</p>
                        <p className="text-sm">Aproveitamento: {value}%</p>
                        <p className="text-xs text-muted-foreground">
                          {item.payload.alunos} alunos · {item.payload.questoes} questões
                        </p>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="aproveitamento"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
                label={{
                  position: 'right',
                  formatter: (v) => `${v}%`,
                  fontSize: 12,
                  fontWeight: 600,
                  fill: 'var(--color-foreground)',
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.aproveitamento)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
