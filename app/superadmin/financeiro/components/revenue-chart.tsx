"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
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
import type { MonthlyRevenue } from "../types"

interface RevenueChartProps {
  data: MonthlyRevenue[]
  isLoading: boolean
}

const chartConfig = {
  revenue: {
    label: "Receita (R$)",
    color: "hsl(var(--chart-1))",
  },
  transactions: {
    label: "Transações",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  // Transform data for chart (convert cents to reais)
  const chartData = data.map((item) => ({
    month: item.month,
    revenue: item.revenueCents / 100,
    transactions: item.transactionCount,
  }))

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Receita Mensal</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(value)
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === "revenue") {
                    return new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value as number)
                  }
                  return value
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            fill="var(--color-revenue)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="transactions"
            stroke="var(--color-transactions)"
            strokeWidth={2}
            dot={{ fill: "var(--color-transactions)" }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
