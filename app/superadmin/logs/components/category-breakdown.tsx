"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { LogStats, LogCategory } from "../types"

interface CategoryBreakdownProps {
  stats: LogStats | null
  isLoading: boolean
}

const categoryLabels: Record<LogCategory, string> = {
  auth: "Autenticação",
  empresa: "Empresa",
  user: "Usuário",
  curso: "Curso",
  payment: "Pagamento",
  integration: "Integração",
  system: "Sistema",
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
]

export function CategoryBreakdown({ stats, isLoading }: CategoryBreakdownProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  const chartData =
    stats?.byCategory.map((item, index) => ({
      name: categoryLabels[item.category] || item.category,
      value: item.count,
      color: COLORS[index % COLORS.length],
    })) || []

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-medium mb-6">Logs por Categoria</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Sem dados de categorias
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Logs por Categoria</h3>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number | undefined) => [`${value || 0} logs`, ""]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
