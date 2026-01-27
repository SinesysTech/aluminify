"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/app/shared/core/client"
import { AlunosTable } from "./alunos-table"
import { AlunosFiltersComponent } from "./alunos-filters"
import type { AlunoWithEmpresa, AlunosFilters } from "../types"

export function AlunosContent() {
  const [alunos, setAlunos] = useState<AlunoWithEmpresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AlunosFilters>({
    search: "",
    empresaId: "all",
  })

  const fetchAlunos = useCallback(async () => {
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
      if (filters.search) {
        params.set("search", filters.search)
      }
      if (filters.empresaId && filters.empresaId !== "all") {
        params.set("empresaId", filters.empresaId)
      }

      const response = await fetch(
        `/api/superadmin/alunos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao carregar alunos")
      }

      const data = await response.json()
      setAlunos(data.data || [])
    } catch (err) {
      console.error("Error fetching alunos:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        fetchAlunos()
      },
      filters.search ? 300 : 0
    )

    return () => clearTimeout(debounceTimer)
  }, [fetchAlunos, filters.search])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchAlunos()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AlunosFiltersComponent filters={filters} onFiltersChange={setFilters} />

      <AlunosTable alunos={alunos} isLoading={isLoading} />

      {!isLoading && alunos.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {alunos.length}{" "}
          {alunos.length === 1 ? "aluno encontrado" : "alunos encontrados"}
        </div>
      )}
    </div>
  )
}
