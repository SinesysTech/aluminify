import type { AppUserRole } from '@/types/user'

export const PROFESSOR_ROLES: AppUserRole[] = ['professor', 'superadmin']

const DEFAULT_ROUTE_BY_ROLE: Record<AppUserRole, string> = {
  aluno: '/tobias',
  professor: '/tobias',
  superadmin: '/tobias',
}

export function isProfessorRole(role: AppUserRole) {
  return PROFESSOR_ROLES.includes(role)
}

export function roleSatisfies(role: AppUserRole, required: AppUserRole) {
  if (required === 'professor') {
    return isProfessorRole(role)
  }
  return role === required
}

export function hasRequiredRole(role: AppUserRole, allowedRoles: AppUserRole[]) {
  return allowedRoles.some((requiredRole) => roleSatisfies(role, requiredRole))
}

export function getDefaultRouteForRole(role: AppUserRole) {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? '/tobias'
}





