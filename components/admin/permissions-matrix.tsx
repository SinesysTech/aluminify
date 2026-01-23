'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { RolePermissions, ResourcePermissions, SimplePermissions } from '@/types/shared/entities/papel'
import { cn } from '@/lib/utils'

// Resource labels in Portuguese
const RESOURCE_LABELS: Record<keyof RolePermissions, string> = {
  dashboard: 'Dashboard',
  cursos: 'Cursos',
  disciplinas: 'Disciplinas',
  alunos: 'Alunos',
  usuarios: 'Usuários',
  agendamentos: 'Agendamentos',
  flashcards: 'Flashcards',
  materiais: 'Materiais',
  configuracoes: 'Configurações',
  branding: 'Branding',
  relatorios: 'Relatórios',
}

// Action labels in Portuguese
const ACTION_LABELS = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
}

// Resources with full CRUD permissions
const FULL_CRUD_RESOURCES: (keyof RolePermissions)[] = [
  'cursos',
  'disciplinas',
  'alunos',
  'usuarios',
  'agendamentos',
  'flashcards',
  'materiais',
]

// Resources with view/edit only
const SIMPLE_RESOURCES: (keyof RolePermissions)[] = ['configuracoes', 'branding']

// Resources with view only
const VIEW_ONLY_RESOURCES: (keyof RolePermissions)[] = ['dashboard', 'relatorios']

interface PermissionsMatrixProps {
  permissions: RolePermissions
  onChange?: (permissions: RolePermissions) => void
  readOnly?: boolean
  className?: string
}

function isResourcePermissions(value: unknown): value is ResourcePermissions {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return 'view' in v && 'create' in v && 'edit' in v && 'delete' in v
}

function isSimplePermissions(value: unknown): value is SimplePermissions {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return 'view' in v && !('create' in v) && !('delete' in v)
}

export function PermissionsMatrix({
  permissions,
  onChange,
  readOnly = false,
  className,
}: PermissionsMatrixProps) {
  const handlePermissionChange = (
    resource: keyof RolePermissions,
    action: 'view' | 'create' | 'edit' | 'delete',
    checked: boolean
  ) => {
    if (readOnly || !onChange) return

    const newPermissions: RolePermissions = { ...permissions }
    const resourcePerms = newPermissions[resource]
    let updatedResourcePerms: RolePermissions[keyof RolePermissions] = resourcePerms

    // Handle dependency: if disabling view, disable all other actions
    if (action === 'view' && !checked) {
      if (isResourcePermissions(resourcePerms)) {
        updatedResourcePerms = {
          view: false,
          create: false,
          edit: false,
          delete: false,
        }
      } else if (isSimplePermissions(resourcePerms)) {
        updatedResourcePerms = {
          view: false,
          edit: false,
        }
      } else {
        updatedResourcePerms = { view: false }
      }
    }
    // Handle dependency: if enabling create/edit/delete, enable view
    else if (['create', 'edit', 'delete'].includes(action) && checked) {
      if (isResourcePermissions(resourcePerms)) {
        const next = { ...resourcePerms } as ResourcePermissions
        next[action as keyof ResourcePermissions] = checked
        next.view = true
        updatedResourcePerms = next
      } else if (isSimplePermissions(resourcePerms) && action === 'edit') {
        const next = { ...resourcePerms } as SimplePermissions
        next.edit = checked
        next.view = true
        updatedResourcePerms = next
      }
    }
    // Normal case
    else {
      if (isResourcePermissions(resourcePerms)) {
        const next = { ...resourcePerms } as ResourcePermissions
        next[action as keyof ResourcePermissions] = checked
        updatedResourcePerms = next
      } else if (isSimplePermissions(resourcePerms)) {
        const next = { ...resourcePerms } as SimplePermissions
        if (action === 'view') {
          next.view = checked
        } else if (action === 'edit') {
          next.edit = checked
        }
        updatedResourcePerms = next
      } else if (action === 'view') {
        updatedResourcePerms = { view: checked }
      }
    }

    // Ao atribuir via índice com key union, o TS exige interseção dos tipos.
    // Fazemos o merge com computed key e consolidamos em RolePermissions.
    onChange({ ...newPermissions, [resource]: updatedResourcePerms } as RolePermissions)
  }

  const getPermissionValue = (
    resource: keyof RolePermissions,
    action: 'view' | 'create' | 'edit' | 'delete'
  ): boolean => {
    const resourcePerms = permissions[resource]
    if (!resourcePerms) return false

    if (action in resourcePerms) {
      return (resourcePerms as Record<string, boolean>)[action] ?? false
    }
    return false
  }

  const renderCheckbox = (
    resource: keyof RolePermissions,
    action: 'view' | 'create' | 'edit' | 'delete',
    disabled: boolean = false
  ) => {
    const id = `${resource}-${action}`
    const checked = getPermissionValue(resource, action)

    return (
      <div className="flex items-center justify-center">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(checked) =>
            handlePermissionChange(resource, action, checked === true)
          }
          disabled={readOnly || disabled}
          className={cn(readOnly && 'cursor-not-allowed opacity-60')}
        />
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Recurso</th>
              <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.view}</th>
              <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.create}</th>
              <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.edit}</th>
              <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.delete}</th>
            </tr>
          </thead>
          <tbody>
            {/* View-only resources */}
            {VIEW_ONLY_RESOURCES.map((resource) => (
              <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Label htmlFor={`${resource}-view`} className="font-normal">
                    {RESOURCE_LABELS[resource]}
                  </Label>
                </td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
              </tr>
            ))}

            {/* Full CRUD resources */}
            {FULL_CRUD_RESOURCES.map((resource) => (
              <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Label htmlFor={`${resource}-view`} className="font-normal">
                    {RESOURCE_LABELS[resource]}
                  </Label>
                </td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'create')}</td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'edit')}</td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'delete')}</td>
              </tr>
            ))}

            {/* Simple resources (view/edit only) */}
            {SIMPLE_RESOURCES.map((resource) => (
              <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Label htmlFor={`${resource}-view`} className="font-normal">
                    {RESOURCE_LABELS[resource]}
                  </Label>
                </td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                <td className="px-4 py-3">{renderCheckbox(resource, 'edit')}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readOnly && (
        <div className="border-t bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground">
          Permissões de papéis do sistema não podem ser alteradas
        </div>
      )}
    </div>
  )
}
