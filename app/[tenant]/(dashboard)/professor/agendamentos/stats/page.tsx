import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

import { CalendarDays, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

async function getDetailedStats(professorId: string) {
  const supabase = await createClient()

  const now = new Date()

  // Get stats for current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Get stats for last month
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Get stats for last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const [currentMonth, lastMonth, allTime] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('status, data_inicio')
      .eq('professor_id', professorId)
      .gte('data_inicio', startOfMonth.toISOString())
      .lte('data_inicio', endOfMonth.toISOString()),
    supabase
      .from('agendamentos')
      .select('status, data_inicio')
      .eq('professor_id', professorId)
      .gte('data_inicio', startOfLastMonth.toISOString())
      .lte('data_inicio', endOfLastMonth.toISOString()),
    supabase
      .from('agendamentos')
      .select('status, data_inicio')
      .eq('professor_id', professorId)
      .gte('data_inicio', sixMonthsAgo.toISOString())
  ])

  const calculateStats = (data: { status: string; data_inicio: string }[] | null) => {
    if (!data) return { total: 0, pendentes: 0, confirmados: 0, cancelados: 0, concluidos: 0 }
    return {
      total: data.length,
      pendentes: data.filter(a => a.status === 'pendente').length,
      confirmados: data.filter(a => a.status === 'confirmado').length,
      cancelados: data.filter(a => a.status === 'cancelado').length,
      concluidos: data.filter(a => a.status === 'concluido').length
    }
  }

  // Calculate hourly distribution
  const hourlyDistribution: Record<number, number> = {}
  if (allTime.data) {
    allTime.data.forEach(a => {
      const hour = new Date(a.data_inicio).getUTCHours()
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
    })
  }

  // Find most popular hour
  let popularHour = 0
  let maxCount = 0
  Object.entries(hourlyDistribution).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count
      popularHour = parseInt(hour)
    }
  })

  // Calculate monthly distribution for last 6 months
  const monthlyData: { month: string; total: number }[] = []
  if (allTime.data) {
    const monthCounts: Record<string, number> = {}
    allTime.data.forEach(a => {
      const date = new Date(a.data_inicio)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    })

    Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, total]) => {
        const [year, m] = month.split('-')
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        monthlyData.push({
          month: `${monthNames[parseInt(m) - 1]}/${year.slice(2)}`,
          total
        })
      })
  }

  return {
    currentMonth: calculateStats(currentMonth.data),
    lastMonth: calculateStats(lastMonth.data),
    allTime: calculateStats(allTime.data),
    popularHour,
    monthlyData
  }
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const stats = await getDetailedStats(user.id)

  const growth = stats.lastMonth.total > 0
    ? Math.round(((stats.currentMonth.total - stats.lastMonth.total) / stats.lastMonth.total) * 100)
    : stats.currentMonth.total > 0 ? 100 : 0

  const confirmationRate = stats.allTime.total > 0
    ? Math.round(((stats.allTime.confirmados + stats.allTime.concluidos) / stats.allTime.total) * 100)
    : 0

  const cancellationRate = stats.allTime.total > 0
    ? Math.round((stats.allTime.cancelados / stats.allTime.total) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professor/agendamentos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Estatísticas de Agendamentos</h1>
          <p className="page-subtitle">
            Analise o desempenho dos seus agendamentos
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Este Mes</h3>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.currentMonth.total}</div>
            <p className="text-xs text-muted-foreground">
              {growth >= 0 ? '+' : ''}{growth}% em relacao ao mes anterior
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Confirmacao</h3>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{confirmationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.allTime.confirmados + stats.allTime.concluidos} de {stats.allTime.total} agendamentos
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Cancelamento</h3>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{cancellationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.allTime.cancelados} cancelados
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Horario Popular</h3>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats.popularHour.toString().padStart(2, '0')}:00
            </div>
            <p className="text-xs text-muted-foreground">
              Horario mais procurado
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Este Mes vs Mes Anterior</h3>
            <p className="text-sm text-muted-foreground">Comparacao de agendamentos</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{stats.currentMonth.total}</span>
                  <span className="text-sm text-muted-foreground">vs {stats.lastMonth.total}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confirmados</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-emerald-600">{stats.currentMonth.confirmados}</span>
                  <span className="text-sm text-muted-foreground">vs {stats.lastMonth.confirmados}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelados</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-red-600">{stats.currentMonth.cancelados}</span>
                  <span className="text-sm text-muted-foreground">vs {stats.lastMonth.cancelados}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-amber-600">{stats.currentMonth.pendentes}</span>
                  <span className="text-sm text-muted-foreground">vs {stats.lastMonth.pendentes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Ultimos 6 Meses</h3>
            <p className="text-sm text-muted-foreground">Evolucao mensal dos agendamentos</p>
          </div>
          <div className="p-6 pt-0">
            {stats.monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
            ) : (
              <div className="space-y-2">
                {stats.monthlyData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">{item.month}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min(100, (item.total / Math.max(...stats.monthlyData.map(d => d.total))) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Time Stats */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo Geral
          </h3>
          <p className="text-sm text-muted-foreground">Estatisticas desde o inicio</p>
        </div>
        <div className="p-6 pt-0">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{stats.allTime.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-amber-600">{stats.allTime.pendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-emerald-600">{stats.allTime.confirmados}</div>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-blue-600">{stats.allTime.concluidos}</div>
              <p className="text-xs text-muted-foreground">Concluidos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-red-600">{stats.allTime.cancelados}</div>
              <p className="text-xs text-muted-foreground">Cancelados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
