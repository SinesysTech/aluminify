'use client'

import React from 'react'
import type { RolePermissions } from '@/app/shared/types/entities/papel'
import { Checkbox } from '@/app/shared/components/forms/checkbox'

interface PermissionsMatrixProps {
  permissions?: RolePermissions
  onChange?: (permissions: RolePermissions) => void
  readonly?: boolean
}

type ActionType = 'view' | 'create' | 'edit' | 'delete'

const RESOURCE_CONFIG: Record<keyof RolePermissions, { label: string; actions: ActionType[] }> = {
  dashboard: { label: 'Dashboard', actions: ['view'] },
  cursos: { label: 'Cursos', actions: ['view', 'create', 'edit', 'delete'] },
  disciplinas: { label: 'Disciplinas', actions: ['view', 'create', 'edit', 'delete'] },
  alunos: { label: 'Alunos', actions: ['view', 'create', 'edit', 'delete'] },
  usuarios: { label: 'Usuários', actions: ['view', 'create', 'edit', 'delete'] },
  agendamentos: { label: 'Agendamentos', actions: ['view', 'create', 'edit', 'delete'] },
  flashcards: { label: 'Flashcards', actions: ['view', 'create', 'edit', 'delete'] },
  materiais: { label: 'Materiais', actions: ['view', 'create', 'edit', 'delete'] },
  configuracoes: { label: 'Configurações', actions: ['view', 'edit'] },
  branding: { label: 'Branding', actions: ['view', 'edit'] },
  relatorios: { label: 'Relatórios', actions: ['view'] },
}

const ACTION_LABELS: Record<ActionType, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
}

const ACTION_KEYS: ActionType[] = ['view', 'create', 'edit', 'delete']

export function PermissionsMatrix({ permissions, onChange, readonly }: PermissionsMatrixProps) {
  if (!permissions) {
    return (
      <div className="p-4 border rounded-lg text-muted-foreground text-sm">
        Nenhuma permissão carregada.
      </div>
    )
  }

  const handlePermissionChange = (resource: keyof RolePermissions, action: ActionType, checked: boolean) => {
    if (readonly || !onChange) return

    // Create a deep copy to avoid mutating state directly (though spread does shallow copy of top level)
    const updatedPermissions = { ...permissions }

    // We need to ensure the resource object is also a copy
    // @ts-expect-error - TS has trouble inferring the specific shape here but we know it's safe based on CONFIG
    updatedPermissions[resource] = {
      ...permissions[resource],
      [action]: checked
    }

    onChange(updatedPermissions)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">
                Recurso
              </th>
              {ACTION_KEYS.map((action) => (
                <th
                  key={action}
                  className="h-10 px-4 text-center align-middle font-medium text-muted-foreground"
                >
                  {ACTION_LABELS[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {(Object.keys(RESOURCE_CONFIG) as Array<keyof RolePermissions>).map((resourceKey) => {
              const config = RESOURCE_CONFIG[resourceKey]

              return (
                <tr key={resourceKey} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">
                    {config.label}
                  </td>
                  {ACTION_KEYS.map((action) => {
                    const isAvailable = config.actions.includes(action)
                    // @ts-expect-error - Safe access
                    const isChecked = permissions[resourceKey]?.[action] === true

                    return (
                      <td key={`${resourceKey}-${action}`} className="p-4 align-middle text-center">
                        {isAvailable ? (
                          <div className="flex justify-center">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(resourceKey, action, checked === true)
                              }
                              disabled={readonly}
                              aria-label={`${ACTION_LABELS[action]} ${config.label}`}
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
