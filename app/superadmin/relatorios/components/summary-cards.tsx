"use client"

import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"

interface SummaryCardsProps {
  summary: {
    totalEmpresas: number
    totalProfessores: number
    totalAlunos: number
    totalCursos: number
    crescimentoEmpresas: number
    crescimentoUsuarios: number
  } | null
  isLoading: boolean
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!summary) return null

  const cards = [
    {
      label: "Empresas",
      value: summary.totalEmpresas,
      icon: Building2,
      growth: summary.crescimentoEmpresas,
      description: "Total cadastradas",
    },
    {
      label: "Professores",
      value: summary.totalProfessores,
      icon: Users,
      description: "Em todas empresas",
    },
    {
      label: "Alunos",
      value: summary.totalAlunos,
      icon: GraduationCap,
      growth: summary.crescimentoUsuarios,
      description: "Total matriculados",
    },
    {
      label: "Cursos",
      value: summary.totalCursos,
      icon: BookOpen,
      description: "Criados na plataforma",
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
            <span className="text-3xl font-bold">
              {card.value.toLocaleString("pt-BR")}
            </span>
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
