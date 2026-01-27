"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "./stats-cards"
import { RecentCompanies } from "./recent-companies"
import type { SuperAdminStats } from "@/app/api/superadmin/stats/route"
import { createClient } from "@/app/shared/core/client"

export function DashboardContent() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError("Sessão expirada. Faça login novamente.")
          return
        }

        const response = await fetch("/api/superadmin/stats", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao carregar métricas")
        }

        const data: SuperAdminStats = await response.json()
        setStats(data)
      } catch (err) {
        console.error("Error fetching stats:", err)
        setError(err instanceof Error ? err.message : "Erro ao carregar métricas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <StatsCards stats={stats} isLoading={isLoading} />
      <RecentCompanies empresas={stats?.recentEmpresas ?? null} isLoading={isLoading} />
    </div>
  )
}
