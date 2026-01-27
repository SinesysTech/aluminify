"use client"

import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  CheckCircle2,
} from "lucide-react"
import { StatCard, StatCardSkeleton } from "./stat-card"
import type { SuperAdminStats } from "@/app/api/superadmin/stats/route"

interface StatsCardsProps {
  stats: SuperAdminStats | null
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={`row1-${i}`} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <StatCardSkeleton key={`row2-${i}`} />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: "Total de Empresas",
      value: stats.totalEmpresas,
      icon: Building2,
      description: "empresas cadastradas",
    },
    {
      title: "Empresas Ativas",
      value: stats.empresasAtivas,
      icon: CheckCircle2,
      description: `${stats.totalEmpresas > 0 ? Math.round((stats.empresasAtivas / stats.totalEmpresas) * 100) : 0}% do total`,
    },
    {
      title: "Total de Usuários",
      value: stats.totalUsuarios,
      icon: Users,
      description: "professores e staff",
    },
    {
      title: "Total de Alunos",
      value: stats.totalAlunos,
      icon: GraduationCap,
      description: "alunos matriculados",
    },
    {
      title: "Cursos Criados",
      value: stats.totalCursos,
      icon: BookOpen,
      description: "cursos na plataforma",
    },
    {
      title: "Ativos (30 dias)",
      value: stats.usuariosAtivos30d,
      icon: Activity,
      description: "usuários com atividade",
    },
  ]

  return (
    <div className="space-y-4">
      {/* First row - 4 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.slice(0, 4).map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
          />
        ))}
      </div>
      {/* Second row - 2 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.slice(4).map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
          />
        ))}
      </div>
    </div>
  )
}
