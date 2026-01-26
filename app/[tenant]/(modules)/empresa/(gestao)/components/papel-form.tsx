'use client'

import type { Papel, RoleTipo, RolePermissions } from '@/app/shared/types/entities/papel'

interface PapelFormProps {
  papel?: Papel
  onSubmit?: (data: { name: string; tipo: RoleTipo; permissions: RolePermissions }) => void
  isLoading?: boolean
}

export function PapelForm({ papel, onSubmit, isLoading }: PapelFormProps) {
  // TODO: Implement papel form
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-muted-foreground">Papel Form - To be implemented</p>
      {papel && <p>Editing: {papel.nome}</p>}
    </div>
  )
}
