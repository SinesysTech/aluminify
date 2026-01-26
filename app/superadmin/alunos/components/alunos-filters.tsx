"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { createClient } from "@/app/shared/core/client"
import type { AlunosFilters, EmpresaOption } from "../types"

interface AlunosFiltersProps {
  filters: AlunosFilters
  onFiltersChange: (filters: AlunosFilters) => void
}

export function AlunosFiltersComponent({
  filters,
  onFiltersChange,
}: AlunosFiltersProps) {
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([])

  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) return

        const response = await fetch("/api/superadmin/empresas", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setEmpresas(
            (data.data || []).map((e: { id: string; nome: string; slug: string }) => ({
              id: e.id,
              nome: e.nome,
              slug: e.slug,
            }))
          )
        }
      } catch (error) {
        console.error("Error fetching empresas:", error)
      }
    }

    fetchEmpresas()
  }, [])

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou CPF..."
          className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      <Select
        value={filters.empresaId || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            empresaId: value as AlunosFilters["empresaId"],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Empresa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as empresas</SelectItem>
          {empresas.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
