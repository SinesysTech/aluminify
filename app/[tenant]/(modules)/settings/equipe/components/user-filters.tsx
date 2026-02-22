"use client"

import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { EQUIPE_FILTER_OPTIONS } from '@/app/shared/utils/papel-display'

interface UserFiltersProps {
  papelTipoFilter: string
  onPapelTipoChange: (value: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  countByTipo: Record<string, number>
}

export function UserFilters({
  papelTipoFilter,
  onPapelTipoChange,
  searchQuery,
  onSearchChange,
  countByTipo,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center w-full">
      {/* Search Input */}
      <div className="relative w-full lg:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full pl-9 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Papel Type Filter */}
      <Select value={papelTipoFilter} onValueChange={onPapelTipoChange}>
        <SelectTrigger className="h-9 w-full lg:w-50">
          <SelectValue placeholder="Filtrar por papel" />
        </SelectTrigger>
        <SelectContent>
          {EQUIPE_FILTER_OPTIONS.map((option) => {
            const count = countByTipo[option.value] || 0
            return (
              <SelectItem key={option.value} value={option.value}>
                {option.label} {count > 0 && `(${count})`}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
