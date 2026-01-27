"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/app/shared/core/client"
import { ProfessoresTable } from "./professores-table"
import { ProfessoresFiltersComponent } from "./professores-filters"
import type { ProfessorWithEmpresa, ProfessoresFilters } from "../types"

export function ProfessoresContent() {
  const [professores, setProfessores] = useState<ProfessorWithEmpresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProfessoresFilters>({
    search: "",
    empresaId: "all",
    isAdmin: "all",
  })

  const fetchProfessores = useCallback(async () => {
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
      if (filters.isAdmin && filters.isAdmin !== "all") {
        params.set("isAdmin", filters.isAdmin)
      }

      const response = await fetch(
        `/api/superadmin/professores?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao carregar professores")
      }

      const data = await response.json()
      setProfessores(data.data || [])
    } catch (err) {
      console.error("Error fetching professores:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao carregar professores"
      )
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        fetchProfessores()
      },
      filters.search ? 300 : 0
    )

    return () => clearTimeout(debounceTimer)
  }, [fetchProfessores, filters.search])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchProfessores()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfessoresFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ProfessoresTable professores={professores} isLoading={isLoading} />

      {!isLoading && professores.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {professores.length}{" "}
          {professores.length === 1
            ? "professor encontrado"
            : "professores encontrados"}
        </div>
      )}
    </div>
  )
}
