"use client"

import { useState } from "react"
import { AgendamentoComDetalhes } from "@/app/actions/agendamentos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgendamentosList } from "./agendamentos-list"
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react"

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
  professorId
}: AgendamentosDashboardProps) {
  const [activeTab, setActiveTab] = useState("pendentes")

  const pendentes = agendamentos.filter(a => a.status === "pendente")
  const confirmados = agendamentos.filter(a => a.status === "confirmado")
  const historico = agendamentos.filter(a =>
    a.status === "cancelado" || a.status === "concluido"
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total do Mes"
          value={stats.total}
          icon={CalendarDays}
          variant="default"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Confirmados"
          value={stats.confirmados}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="confirmados">
            Confirmados ({confirmados.length})
          </TabsTrigger>
          <TabsTrigger value="historico">
            Historico ({historico.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4">
          <AgendamentosList
            agendamentos={pendentes}
            showActions={true}
            emptyMessage="Nenhum agendamento pendente"
          />
        </TabsContent>

        <TabsContent value="confirmados" className="mt-4">
          <AgendamentosList
            agendamentos={confirmados}
            showActions={true}
            emptyMessage="Nenhum agendamento confirmado"
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <AgendamentosList
            agendamentos={historico}
            showActions={false}
            emptyMessage="Nenhum agendamento no historico"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: React.ElementType
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variantStyles[variant]}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
