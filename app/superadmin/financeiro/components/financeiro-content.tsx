"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { FinancialSummary } from "./financial-summary"
import { RevenueChart } from "./revenue-chart"
import { RevenueByEmpresaTable } from "./revenue-by-empresa"
import { PaymentMethodsChart } from "./payment-methods-chart"
import { RecentTransactions } from "./recent-transactions"
import type { GlobalFinancialData } from "../types"

export function FinanceiroContent() {
  const [data, setData] = useState<GlobalFinancialData | null>(null)
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

      const response = await fetch("/api/superadmin/financeiro", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao carregar dados financeiros")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error("Error fetching financial data:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados financeiros"
      )
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

      {/* Summary Cards */}
      <FinancialSummary stats={data?.stats || null} isLoading={isLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart
            data={data?.monthlyRevenue || []}
            isLoading={isLoading}
          />
        </div>
        <div>
          <PaymentMethodsChart
            data={data?.stats?.byPaymentMethod || {}}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByEmpresaTable
          data={data?.revenueByEmpresa || []}
          isLoading={isLoading}
        />
        <RecentTransactions
          data={data?.recentTransactions || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
