"use client"

import { Search } from 'lucide-react'
import { Input } from '@/app/shared/components/forms/input'
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
        <Input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 md:h-8 pl-9"
        />
      </div>

      {/* Papel Type Filter */}
      <Select value={papelTipoFilter} onValueChange={onPapelTipoChange}>
        <SelectTrigger size="sm" className="w-full sm:w-50">
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
