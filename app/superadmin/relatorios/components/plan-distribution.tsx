"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/shared/components/dataviz/chart"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { PlanDistribution as PlanDistributionType } from "../types"

interface PlanDistributionProps {
  data: PlanDistributionType[]
  isLoading: boolean
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

const chartConfig = {
  total: {
    label: "Total",
  },
  basico: {
    label: "Básico",
    color: COLORS[0],
  },
  profissional: {
    label: "Profissional",
    color: COLORS[1],
  },
  enterprise: {
    label: "Enterprise",
    color: COLORS[2],
  },
} satisfies ChartConfig

export function PlanDistributionChart({
  data,
  isLoading,
}: PlanDistributionProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      </div>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Distribuição por Plano</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="plano"
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

        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={item.plano} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">
                {item.plano}: {item.total} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
