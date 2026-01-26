"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/app/shared/components/dataviz/chart"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { GrowthDataPoint } from "../types"

interface GrowthChartProps {
  data: GrowthDataPoint[]
  isLoading: boolean
}

const chartConfig = {
  empresas: {
    label: "Empresas",
    color: "hsl(var(--chart-1))",
  },
  professores: {
    label: "Professores",
    color: "hsl(var(--chart-2))",
  },
  alunos: {
    label: "Alunos",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function GrowthChart({ data, isLoading }: GrowthChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Crescimento Mensal</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="empresas"
            fill="var(--color-empresas)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="professores"
            fill="var(--color-professores)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="alunos"
            fill="var(--color-alunos)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
