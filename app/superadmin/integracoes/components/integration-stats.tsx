"use client"

import { Building2, Key, Link2, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { IntegrationStats } from "../types"

interface IntegrationStatsCardsProps {
  stats: IntegrationStats | null
  isLoading: boolean
}

export function IntegrationStatsCards({
  stats,
  isLoading,
}: IntegrationStatsCardsProps) {
  const cards = [
    {
      title: "Empresas com Integrações",
      value: stats?.empresasWithIntegrations || 0,
      total: stats?.totalEmpresas || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Integrações Ativas",
      value:
        stats?.integrationsByProvider?.reduce((acc: number, p) => acc + p.connected, 0) ||
        0,
      subtitle: "Conexões estabelecidas",
      icon: Link2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "API Keys Ativas",
      value: stats?.activeApiKeys || 0,
      subtitle: `${stats?.expiredApiKeys || 0} expiradas`,
      icon: Key,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Integrações com Erro",
      value:
        stats?.integrationsByProvider?.reduce((acc: number, p) => acc + p.error, 0) || 0,
      subtitle: "Requerem atenção",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
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
              {card.total ? (
                <span className="text-sm text-muted-foreground ml-1">
                  / {card.total}
                </span>
              ) : null}
            </div>
            {card.subtitle && (
              <span className="text-xs text-muted-foreground">
                {card.subtitle}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
