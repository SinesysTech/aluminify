"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "./summary-cards"
import { GrowthChart } from "./growth-chart"
import { PlanDistributionChart } from "./plan-distribution"
import { TopEmpresasTable } from "./top-empresas"
import { ExportButtons } from "./export-buttons"
import type { ReportStats } from "../types"

export function RelatoriosContent() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError("Sessão expirada. Faça login novamente.")
        return
      }

      const response = await fetch("/api/superadmin/relatorios", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao carregar relatórios")
      }

      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error("Error fetching reports:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao carregar relatórios"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchStats()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Atualizar</span>
        </Button>
        <ExportButtons />
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={stats?.summary || null} isLoading={isLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthChart data={stats?.growthData || []} isLoading={isLoading} />
        </div>
        <div>
          <PlanDistributionChart
            data={stats?.planDistribution || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Top Empresas */}
      <TopEmpresasTable data={stats?.topEmpresas || []} isLoading={isLoading} />
    </div>
  )
}
