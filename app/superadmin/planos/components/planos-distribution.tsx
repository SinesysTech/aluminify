"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/shared/components/dataviz/chart"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { PlanoDistribution } from "../types"
import { formatPlanPrice } from "../config"

interface PlanosDistributionProps {
  data: PlanoDistribution[]
  isLoading: boolean
}

const COLORS: Record<string, string> = {
  basico: "hsl(var(--chart-3))",
  profissional: "hsl(var(--chart-1))",
  enterprise: "hsl(var(--chart-2))",
}

const chartConfig = {
  count: {
    label: "Empresas",
  },
} satisfies ChartConfig

export function PlanosDistribution({
  data,
  isLoading,
}: PlanosDistributionProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    fill: COLORS[item.planoId] || "hsl(var(--chart-4))",
  }))

  const total = chartData.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-medium mb-6">Distribuição por Plano</h3>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa cadastrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Distribuição por Plano</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex flex-col gap-4 flex-1">
          {data.map((item) => (
            <div
              key={item.planoId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[item.planoId] || "hsl(var(--chart-4))",
                  }}
                />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPlanPrice(item.priceCents)}/mês
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.count}</div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
