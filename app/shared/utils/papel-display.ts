/**
 * Utilitarios para exibicao de papeis de usuario
 */

import type { RoleTipo } from '@/app/shared/types/entities/papel'

export const ROLE_TIPO_LABELS: Record<RoleTipo, string> = {
  professor: 'Professor',
  professor_admin: 'Professor Admin',
  staff: 'Equipe',
  admin: 'Administrador',
  monitor: 'Monitor',
}

export const ROLE_TIPO_COLORS: Record<RoleTipo, string> = {
  professor: 'bg-blue-50 text-blue-700 border-blue-200',
  professor_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  staff: 'bg-gray-50 text-gray-700 border-gray-200',
  admin: 'bg-amber-50 text-amber-700 border-amber-200',
  monitor: 'bg-green-50 text-green-700 border-green-200',
}

export function getRoleTipoLabel(tipo: RoleTipo): string {
  return ROLE_TIPO_LABELS[tipo] || tipo
}

export function getRoleTipoColor(tipo: RoleTipo): string {
  return ROLE_TIPO_COLORS[tipo] || 'bg-gray-50 text-gray-700 border-gray-200'
}

export const ROLE_TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'professor', label: 'Professores' },
  { value: 'professor_admin', label: 'Professores Admin' },
  { value: 'admin', label: 'Administradores' },
  { value: 'staff', label: 'Equipe' },
  { value: 'monitor', label: 'Monitores' },
] as const
