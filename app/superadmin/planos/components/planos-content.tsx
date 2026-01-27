"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { PlanosStats } from "./planos-stats"
import { PlanosOverview } from "./planos-overview"
import { PlanosDistribution } from "./planos-distribution"
import { EmpresasByPlan } from "./empresas-by-plan"
import type { PlanoConfig, PlanoStats, PlanoDistribution } from "../types"

interface PlanosData {
  planos: PlanoConfig[]
  stats: PlanoStats[]
  distribution: PlanoDistribution[]
  totalEmpresas: number
  mrr: number
}

export function PlanosContent() {
  const [data, setData] = useState<PlanosData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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

      const response = await fetch("/api/superadmin/planos", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao carregar planos")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error("Error fetching planos:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar planos")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchData()}
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
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <PlanosStats
        stats={data?.stats || []}
        totalEmpresas={data?.totalEmpresas || 0}
        mrr={data?.mrr || 0}
        isLoading={isLoading}
      />

      {/* Plans Overview */}
      <PlanosOverview
        planos={data?.planos || []}
        stats={data?.stats || []}
        isLoading={isLoading}
      />

      {/* Distribution and Empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanosDistribution
          data={data?.distribution || []}
          isLoading={isLoading}
        />
        <EmpresasByPlan onPlanChanged={fetchData} />
      </div>
    </div>
  )
}
