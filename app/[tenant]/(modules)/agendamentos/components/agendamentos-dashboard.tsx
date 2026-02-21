"use client"

import type { ElementType } from "react"
import { useEffect, useState } from "react"
import type { AgendamentoComDetalhes } from "@/app/[tenant]/(modules)/agendamentos/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgendamentosList } from "./agendamentos-list"
import { CalendarDays, CheckCircle, XCircle, Grid3X3 } from "lucide-react"
import { AgendamentosSituacaoChart } from "./agendamentos-situacao-chart"
import { AgendamentoWeeklyGrid } from "./agendamento-weekly-grid"

interface AgendamentosDashboardProps {
  agendamentos: AgendamentoComDetalhes[]
  stats: {
    total: number
    pendentes: number
    confirmados: number
    cancelados: number
    concluidos: number
  }
  professorId: string
}

export function AgendamentosDashboard({
  agendamentos,
  stats,
  professorId: _professorId
}: AgendamentosDashboardProps) {
  // Default to weekly view as it's the requested improvement
  const [activeTab, setActiveTab] = useState("semana")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necessário para evitar mismatch de hidratação (Radix IDs) ao renderizar Tabs no SSR
    setIsMounted(true)
  }, [])

  const ativos = agendamentos.filter(a => a.status === "confirmado" || a.status === "pendente")
  const historico = agendamentos.filter(a =>
    a.status === "cancelado" || a.status === "concluido"
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total do Mes"
          value={stats.total}
          icon={CalendarDays}
          variant="default"
        />
        {/* Keeping "Pendentes" stat just in case some legacy data remains, but focusing on "Confirmados" */}
        <StatsCard
          title="Agendados"
          value={stats.confirmados + stats.pendentes}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Cancelados"
          value={stats.cancelados}
          icon={XCircle}
          variant="destructive"
        />
      </div>

      <AgendamentosSituacaoChart
        title="Situação gráfica"
        description="Distribuição dos agendamentos no período atual."
        stats={stats}
      />

      {/* Tabs */}
      {isMounted ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="semana" className="gap-2">
                <Grid3X3 className="h-4 w-4" />
                Visão Semanal
              </TabsTrigger>
              <TabsTrigger value="lista">
                Lista ({ativos.length})
              </TabsTrigger>
              <TabsTrigger value="historico">
                Histórico ({historico.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="semana" className="mt-4">
            <AgendamentoWeeklyGrid agendamentos={ativos} />
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            <AgendamentosList
              agendamentos={ativos}
              showActions={true}
              emptyMessage="Nenhum agendamento ativo"
            />
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <AgendamentosList
              agendamentos={historico}
              showActions={false}
              emptyMessage="Nenhum agendamento no histórico"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-4">
          {/* Fallback for SSR */}
          Carregando visualização...
        </div>
      )}
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: ElementType
  variant: "default" | "warning" | "success" | "destructive"
}

function StatsCard({ title, value, icon: Icon, variant }: StatsCardProps) {
  const variantStyles = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
    destructive: "text-red-600 dark:text-red-400"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="metric-label">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className={`metric-value ${variantStyles[variant]}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
