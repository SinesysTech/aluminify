"use client"

import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import type { EmpresaFilters } from "../types"

interface EmpresasFiltersProps {
  filters: EmpresaFilters
  onFiltersChange: (filters: EmpresaFilters) => void
}

export function EmpresasFilters({ filters, onFiltersChange }: EmpresasFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, slug ou CNPJ..."
          className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as EmpresaFilters["status"],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="ativo">Ativas</SelectItem>
          <SelectItem value="inativo">Inativas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.plano || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            plano: value as EmpresaFilters["plano"],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os planos</SelectItem>
          <SelectItem value="basico">Básico</SelectItem>
          <SelectItem value="profissional">Profissional</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
