"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { LogStatsCards } from "./log-stats"
import { ActivityChart } from "./activity-chart"
import { CategoryBreakdown } from "./category-breakdown"
import { LogsTable } from "./logs-table"
import { LogFiltersComponent } from "./log-filters"
import type { AuditLog, LogStats, LogFilters } from "../types"

interface LogsData {
  logs: AuditLog[]
  stats: LogStats
  totalFiltered: number
}

export function LogsContent() {
  const [data, setData] = useState<LogsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<LogFilters>({})

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

      // Build query params
      const params = new URLSearchParams()
      if (filters.level) params.set("level", filters.level)
      if (filters.category) params.set("category", filters.category)
      if (filters.search) params.set("search", filters.search)
      if (filters.empresaId) params.set("empresaId", filters.empresaId)

      const response = await fetch(`/api/superadmin/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao carregar logs")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error("Error fetching logs:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar logs")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFiltersChange = (newFilters: LogFilters) => {
    setFilters(newFilters)
  }

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
      <div className="flex items-center justify-between">
        <LogFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
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
      <LogStatsCards stats={data?.stats || null} isLoading={isLoading} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart stats={data?.stats || null} isLoading={isLoading} />
        <CategoryBreakdown stats={data?.stats || null} isLoading={isLoading} />
      </div>

      {/* Logs Table */}
      <LogsTable
        logs={data?.logs || []}
        isLoading={isLoading}
        totalFiltered={data?.totalFiltered || 0}
      />
    </div>
  )
}
