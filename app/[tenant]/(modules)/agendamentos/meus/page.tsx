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
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, CheckCircle, XCircle } from "lucide-react"
import { AgendamentosSituacaoChart } from "../components/agendamentos-situacao-chart"
import { PageShell } from '@/app/shared/components/layout/page-shell'
import { cn } from '@/lib/utils'

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
    <PageShell
      title="Meus Agendamentos"
      subtitle="Acompanhe suas sessões agendadas e o status de cada atendimento."
      actions={
        <Button asChild>
          <Link href={`/${tenant}/agendamentos`}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar atendimento
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
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
    </PageShell>
  )
}

type StatsCardVariant = "default" | "warning" | "success" | "destructive"

type StatsCardProps = {
  title: string
  value: number
  icon: ElementType
  variant: StatsCardVariant
}

const variantConfig: Record<StatsCardVariant, {
  iconBg: string
  accentFrom: string
  accentTo: string
  hoverShadow: string
}> = {
  default: {
    iconBg: 'bg-linear-to-br from-blue-500 to-indigo-500',
    accentFrom: 'from-blue-400',
    accentTo: 'to-indigo-500',
    hoverShadow: 'hover:shadow-blue-500/8',
  },
  warning: {
    iconBg: 'bg-linear-to-br from-amber-500 to-orange-500',
    accentFrom: 'from-amber-400',
    accentTo: 'to-orange-500',
    hoverShadow: 'hover:shadow-amber-500/8',
  },
  success: {
    iconBg: 'bg-linear-to-br from-emerald-500 to-green-500',
    accentFrom: 'from-emerald-400',
    accentTo: 'to-green-500',
    hoverShadow: 'hover:shadow-emerald-500/8',
  },
  destructive: {
    iconBg: 'bg-linear-to-br from-rose-500 to-red-500',
    accentFrom: 'from-rose-400',
    accentTo: 'to-red-500',
    hoverShadow: 'hover:shadow-rose-500/8',
  },
}

function StatsCard({ title, value, icon: Icon, variant }: StatsCardProps) {
  const config = variantConfig[variant]

  return (
    <Card className={cn(
      'group overflow-hidden transition-colors duration-200 motion-reduce:transition-none py-0 gap-0 rounded-2xl',
      'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5',
      'hover:shadow-lg',
      config.hoverShadow,
    )}>
      <div className={cn('h-0.5 bg-linear-to-r', config.accentFrom, config.accentTo)} />
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="metric-label leading-tight">{title}</span>
          <div className={cn(
            'flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl transition-colors duration-200 motion-reduce:transition-none',
            config.iconBg
          )}>
            <Icon className="h-4 w-4 md:h-4.5 md:w-4.5 text-white" />
          </div>
        </div>
        <span className="metric-value">{value}</span>
      </CardContent>
    </Card>
  )
}