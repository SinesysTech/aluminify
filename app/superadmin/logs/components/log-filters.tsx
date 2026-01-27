"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { Input } from "@/app/shared/components/forms/input"
import { LOG_CATEGORIES, LOG_LEVELS, type LogFilters } from "../types"

interface LogFiltersProps {
  filters: LogFilters
  onFiltersChange: (filters: LogFilters) => void
}

export function LogFiltersComponent({
  filters,
  onFiltersChange,
}: LogFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Input
        placeholder="Buscar logs..."
        value={filters.search || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value })
        }
        className="max-w-xs"
      />

      <Select
        value={filters.level || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            level: value === "all" ? undefined : (value as LogFilters["level"]),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Nível" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos níveis</SelectItem>
          {LOG_LEVELS.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            category:
              value === "all" ? undefined : (value as LogFilters["category"]),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {LOG_CATEGORIES.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
