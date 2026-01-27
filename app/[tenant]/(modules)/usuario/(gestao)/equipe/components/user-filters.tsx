"use client"

import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLE_TIPO_OPTIONS } from '@/app/shared/utils/papel-display'

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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Papel Type Filter */}
      <Select value={papelTipoFilter} onValueChange={onPapelTipoChange}>
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Filtrar por papel" />
        </SelectTrigger>
        <SelectContent>
          {ROLE_TIPO_OPTIONS.map((option) => {
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
