'use client'

import type { RolePermissions } from '@/app/shared/types/entities/papel'

interface PermissionsMatrixProps {
  permissions?: RolePermissions
  onChange?: (permissions: RolePermissions) => void
  readonly?: boolean
}

export function PermissionsMatrix({ permissions, onChange, readonly }: PermissionsMatrixProps) {
  // TODO: Implement permissions matrix
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-muted-foreground">Permissions Matrix - To be implemented</p>
      {readonly && <p className="text-sm text-muted-foreground">Read only mode</p>}
    </div>
  )
}
