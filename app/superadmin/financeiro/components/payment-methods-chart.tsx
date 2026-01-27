"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/shared/components/dataviz/chart"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"

interface PaymentMethodsChartProps {
  data: Record<string, { count: number; amountCents: number }>
  isLoading: boolean
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const METHOD_LABELS: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "PIX",
  boleto: "Boleto",
  bank_transfer: "Transferência",
  other: "Outros",
}

const chartConfig = {
  amount: {
    label: "Valor",
  },
} satisfies ChartConfig

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

export function PaymentMethodsChart({
  data,
  isLoading,
}: PaymentMethodsChartProps) {
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

  const chartData = Object.entries(data).map(([method, values], index) => ({
    method: METHOD_LABELS[method] || method,
    amount: values.amountCents / 100,
    count: values.count,
    fill: COLORS[index % COLORS.length],
  }))

  const total = chartData.reduce((sum, item) => sum + item.amount, 0)

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-medium mb-6">Métodos de Pagamento</h3>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhuma transação encontrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Métodos de Pagamento</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency((value as number) * 100)}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="method"
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

        <div className="flex flex-col gap-2 flex-1">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.amount / total) * 100) : 0
            return (
              <div
                key={item.method}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.method}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {item.count} tx
                  </span>
                  <span className="text-sm font-medium">
                    {percentage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
