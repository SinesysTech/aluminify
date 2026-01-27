"use client"

import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Banknote,
} from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { GlobalFinancialStats } from "../types"

interface FinancialSummaryProps {
  stats: GlobalFinancialStats | null
  isLoading: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

export function FinancialSummary({ stats, isLoading }: FinancialSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      label: "Receita Total",
      value: formatCurrency(stats.totalRevenueCents),
      icon: DollarSign,
      description: "Aprovadas",
      growth: stats.revenueGrowthPercent,
    },
    {
      label: "MRR (30 dias)",
      value: formatCurrency(stats.mrrCents),
      icon: Banknote,
      description: "Receita recorrente",
    },
    {
      label: "Transações",
      value: stats.totalTransactions.toLocaleString("pt-BR"),
      icon: Receipt,
      description: "Total processadas",
      growth: stats.transactionGrowthPercent,
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(stats.averageTicketCents),
      icon: CreditCard,
      description: "Por transação",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-card p-6 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{card.value}</span>
            {card.growth !== undefined && (
              <span
                className={`flex items-center text-xs ${
                  card.growth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.growth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(card.growth)}%
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {card.description}
          </span>
        </div>
      ))}
    </div>
  )
}
