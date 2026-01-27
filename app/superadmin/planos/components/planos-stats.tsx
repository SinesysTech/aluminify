"use client"

import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { PlanoStats } from "../types"
import { formatPlanPrice } from "../config"

interface PlanosStatsProps {
  stats: PlanoStats[]
  totalEmpresas: number
  mrr: number
  isLoading: boolean
}

export function PlanosStats({
  stats,
  totalEmpresas,
  mrr,
  isLoading,
}: PlanosStatsProps) {
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

  const totalUsuarios = stats.reduce((sum, s) => sum + s.totalUsuarios, 0)
  const empresasAtivas = stats.reduce((sum, s) => sum + s.empresasAtivas, 0)
  const totalRevenue30d = stats.reduce((sum, s) => sum + s.totalRevenue, 0)

  const cards = [
    {
      label: "Total de Empresas",
      value: totalEmpresas.toString(),
      subvalue: `${empresasAtivas} ativas`,
      icon: Building2,
    },
    {
      label: "MRR Estimado",
      value: formatPlanPrice(mrr),
      subvalue: "Receita recorrente mensal",
      icon: DollarSign,
    },
    {
      label: "Receita 30 dias",
      value: formatPlanPrice(totalRevenue30d),
      subvalue: "Transações aprovadas",
      icon: TrendingUp,
    },
    {
      label: "Total de Usuários",
      value: totalUsuarios.toLocaleString("pt-BR"),
      subvalue: "Professores + Alunos",
      icon: Users,
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
          <span className="text-2xl font-bold">{card.value}</span>
          <span className="text-xs text-muted-foreground">{card.subvalue}</span>
        </div>
      ))}
    </div>
  )
}
