"use client"

import { Area, AreaChart, CartesianGrid } from "recharts"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/dataviz/chart"
import { Badge } from "@/components/ui/badge"
import CalendarDateRangePicker from "@/components/ui/custom-date-range-picker"

export interface MonthlyProgressItem {
  month: string
  value: number
}

export interface CourseProgressByMonthProps {
  data: MonthlyProgressItem[]
  comparisonValue?: number
  comparisonDelta?: number
  title?: string
  showDatePicker?: boolean
  onDateRangeChange?: (range: { from: Date; to: Date }) => void
}

const chartConfig = {
  value: {
    label: "Concluidas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function CourseProgressByMonth({
  data,
  comparisonValue,
  comparisonDelta,
  title = "Progresso por Mes",
  showDatePicker = false,
}: CourseProgressByMonthProps) {
  if (data.length === 0) {
    return (
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground text-sm">Sem dados de progresso mensal</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {comparisonValue != null && (
          <CardDescription className="flex items-center gap-2">
            Comparado ao mes anterior {comparisonValue.toFixed(2)}%
            {comparisonDelta != null && (
              <Badge>
                {comparisonDelta >= 0 ? "+" : ""}
                {comparisonDelta.toFixed(1)}%
              </Badge>
            )}
          </CardDescription>
        )}
        {showDatePicker && (
          <CardAction>
            <CalendarDateRangePicker />
          </CardAction>
        )}
      </CardHeader>
      <ChartContainer className="w-full lg:h-[430px]" config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ left: 0, right: 0 }}
        >
          <CartesianGrid vertical={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            dataKey="value"
            type="natural"
            fill="url(#fillValue)"
            fillOpacity={0.4}
            stroke="var(--color-value)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
