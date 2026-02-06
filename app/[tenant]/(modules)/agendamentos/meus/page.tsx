import type { Metadata } from 'next'
import type { ElementType } from 'react'
import { resolveEmpresaIdFromTenant } from '@/app/shared/core/resolve-empresa-from-tenant'
import { getAgendamentosAluno } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { MeusAgendamentosList } from "../components/meus-agendamentos-list"
import { ProfessorAgendamentosView } from "../components/agendamentos-professor-view"
import { requireUser } from "@/app/shared/core/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, CheckCircle, XCircle } from "lucide-react"
import { AgendamentosSituacaoChart } from "../components/agendamentos-situacao-chart"

export const metadata: Metadata = {
  title: 'Meus Agendamentos'
}

interface MeusAgendamentosPageProps {
  params: Promise<{ tenant: string }>
}

export default async function MeusAgendamentosPage({ params }: MeusAgendamentosPageProps) {
  const { tenant } = await params
  const user = await requireUser()

  // If not student, show professor/staff/admin view
  if (user.role !== 'aluno') {
    const viewUserId = user.isAdmin ? 'all' : user.id
    return <ProfessorAgendamentosView userId={viewUserId} empresaId={user.empresaId ?? undefined} />
  }

  // Always resolve empresa from the current tenant URL to ensure tenant isolation
  const empresaId = await resolveEmpresaIdFromTenant(tenant || '') ?? user.empresaId
  const agendamentos = await getAgendamentosAluno(user.id, empresaId)

  // Stats do mês atual (para cards + gráfico)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const agendamentosDoMes = agendamentos.filter((a) => {
    const d = new Date(a.data_inicio)
    return d >= startOfMonth && d <= endOfMonth
  })

  const stats = {
    total: agendamentosDoMes.length,
    pendentes: agendamentosDoMes.filter(a => a.status === 'pendente').length,
    confirmados: agendamentosDoMes.filter(a => a.status === 'confirmado').length,
    cancelados: agendamentosDoMes.filter(a => a.status === 'cancelado').length,
    concluidos: agendamentosDoMes.filter(a => a.status === 'concluido').length,
  }

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Meus Agendamentos</h1>
          <p className="page-subtitle">
            Acompanhe suas sessões agendadas e o status de cada atendimento.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${tenant}/agendamentos`}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar atendimento
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatsCard title="Total do mês" value={stats.total} icon={CalendarDays} variant="default" />
          <StatsCard title="Confirmados" value={stats.confirmados} icon={CheckCircle} variant="success" />
          <StatsCard title="Cancelados" value={stats.cancelados} icon={XCircle} variant="destructive" />
        </div>

        <AgendamentosSituacaoChart
          title="Situação gráfica"
          description="Distribuição dos seus agendamentos neste mês."
          stats={stats}
        />

        <MeusAgendamentosList agendamentos={agendamentos} />
      </div>
    </div>
  )
}

type StatsCardProps = {
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
    destructive: "text-red-600 dark:text-red-400",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</div>
      </CardContent>
    </Card>
  )
}