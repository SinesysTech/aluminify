"use client"

import { FileText, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { LogStats } from "../types"

interface LogStatsCardsProps {
  stats: LogStats | null
  isLoading: boolean
}

export function LogStatsCards({ stats, isLoading }: LogStatsCardsProps) {
  const cards = [
    {
      title: "Total de Logs",
      value: stats?.totalLogs || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Sucessos",
      value: stats?.byLevel.success || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Avisos",
      value: stats?.byLevel.warning || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Erros",
      value: stats?.byLevel.error || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
