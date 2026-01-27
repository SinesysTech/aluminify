"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/app/shared/core/client"
import { EmpresasTable } from "./empresas-table"
import { EmpresasFilters } from "./empresas-filters"
import { CreateEmpresaDialog } from "./create-empresa-dialog"
import type { EmpresaWithMetrics, EmpresaFilters as FiltersType } from "../types"

export function EmpresasContent() {
  const [empresas, setEmpresas] = useState<EmpresaWithMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FiltersType>({
    status: "all",
    plano: "all",
    search: "",
  })

  const fetchEmpresas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError("Sessão expirada. Faça login novamente.")
        return
      }

      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status)
      }
      if (filters.plano && filters.plano !== "all") {
        params.set("plano", filters.plano)
      }
      if (filters.search) {
        params.set("search", filters.search)
      }

      const response = await fetch(`/api/superadmin/empresas?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao carregar empresas")
      }

      const data = await response.json()
      setEmpresas(data.data || [])
    } catch (err) {
      console.error("Error fetching empresas:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar empresas")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchEmpresas()
    }, filters.search ? 300 : 0)

    return () => clearTimeout(debounceTimer)
  }, [fetchEmpresas, filters.search])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchEmpresas()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <EmpresasFilters filters={filters} onFiltersChange={setFilters} />
        <CreateEmpresaDialog onSuccess={fetchEmpresas} />
      </div>

      <EmpresasTable
        empresas={empresas}
        isLoading={isLoading}
        onRefresh={fetchEmpresas}
      />

      {!isLoading && empresas.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {empresas.length} {empresas.length === 1 ? "empresa encontrada" : "empresas encontradas"}
        </div>
      )}
    </div>
  )
}
