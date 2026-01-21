import type {
  AppUserRole,
  LegacyAppUserRole,
} from "@/types/shared/entities/user";
import type { RoleTipo, RolePermissions } from "@/types/shared/entities/papel";
import {
  ADMIN_ROLES as ADMIN_ROLE_TIPOS,
  TEACHING_ROLES as TEACHING_ROLE_TIPOS,
} from "@/types/shared/entities/papel";

// Legacy role arrays (for backward compatibility)
// @deprecated Use hasPermission or isTeachingRole instead
export const PROFESSOR_ROLES: LegacyAppUserRole[] = ["professor", "superadmin"];
// @deprecated Use hasPermission instead
export const ADMIN_ROLES: LegacyAppUserRole[] = [
  "professor",
  "superadmin",
  "empresa",
];

// Default routes by main role
const DEFAULT_ROUTE_BY_ROLE: Record<AppUserRole, string> = {
  aluno: "/aluno/dashboard",
  usuario: "/professor/dashboard",
  superadmin: "/superadmin/dashboard",
};

// Legacy route map (for backward compatibility)
const LEGACY_ROUTE_BY_ROLE: Record<LegacyAppUserRole, string> = {
  aluno: "/aluno/dashboard",
  professor: "/professor/dashboard",
  superadmin: "/superadmin/dashboard",
  empresa: "/empresa/dashboard",
};

/**
 * Check if a role tipo is a teaching role
 */
export function isTeachingRoleTipo(tipo: RoleTipo): boolean {
  return TEACHING_ROLE_TIPOS.includes(tipo);
}

/**
 * Check if a role tipo is an admin role
 */
export function isAdminRoleTipo(tipo: RoleTipo): boolean {
  return ADMIN_ROLE_TIPOS.includes(tipo);
}

/**
 * Check if user has permission to perform an action on a resource
 */
export function hasPermission(
  permissions: RolePermissions | undefined,
  resource: keyof RolePermissions,
  action: "view" | "create" | "edit" | "delete",
): boolean {
  if (!permissions) return false;

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  if (action in resourcePermissions) {
    return (resourcePermissions as Record<string, boolean>)[action] ?? false;
  }

  return false;
}

/**
 * Check if user can view a resource
 */
export function canView(
  permissions: RolePermissions | undefined,
  resource: keyof RolePermissions,
): boolean {
  return hasPermission(permissions, resource, "view");
}

/**
 * Check if user can create a resource
 */
export function canCreate(
  permissions: RolePermissions | undefined,
  resource: keyof RolePermissions,
): boolean {
  return hasPermission(permissions, resource, "create");
}

/**
 * Check if user can edit a resource
 */
export function canEdit(
  permissions: RolePermissions | undefined,
  resource: keyof RolePermissions,
): boolean {
  return hasPermission(permissions, resource, "edit");
}

/**
 * Check if user can delete a resource
 */
export function canDelete(
  permissions: RolePermissions | undefined,
  resource: keyof RolePermissions,
): boolean {
  return hasPermission(permissions, resource, "delete");
}

/**
 * @deprecated Use isTeachingRoleTipo instead
 */
export function isProfessorRole(role: AppUserRole | LegacyAppUserRole) {
  return role === "professor" || role === "usuario" || role === "superadmin";
}

/**
 * @deprecated Use hasPermission instead
 */
export function roleSatisfies(
  role: AppUserRole | LegacyAppUserRole,
  required: AppUserRole | LegacyAppUserRole,
) {
  if (required === "professor" || required === "usuario") {
    return isProfessorRole(role);
  }
  return role === required;
}

/**
 * @deprecated Use hasPermission instead
 */
export function hasRequiredRole(
  role: AppUserRole | LegacyAppUserRole,
  allowedRoles: (AppUserRole | LegacyAppUserRole)[],
) {
  return allowedRoles.some((requiredRole) => roleSatisfies(role, requiredRole));
}

/**
 * Get the default route for a role
 */
export function getDefaultRouteForRole(
  role: AppUserRole | LegacyAppUserRole,
  _roleType?: RoleTipo,
): string {
  // Check legacy roles first
  if (role in LEGACY_ROUTE_BY_ROLE) {
    return LEGACY_ROUTE_BY_ROLE[role as LegacyAppUserRole];
  }

  // Check new roles
  if (role in DEFAULT_ROUTE_BY_ROLE) {
    return DEFAULT_ROUTE_BY_ROLE[role as AppUserRole];
  }

  return "/aluno/dashboard";
}

/**
 * Check if a role is an admin role
 * @deprecated Use isAdminRoleTipo or hasPermission instead
 */
export function isAdminRole(
  role: AppUserRole | LegacyAppUserRole,
  roleType?: RoleTipo,
) {
  if (role === "superadmin") return true;
  if (roleType && isAdminRoleTipo(roleType)) return true;
  return ADMIN_ROLES.includes(role as LegacyAppUserRole);
}

/**
 * Check if user can impersonate other users
 */
export function canImpersonate(
  role: AppUserRole | LegacyAppUserRole,
  roleType?: RoleTipo,
) {
  return isAdminRole(role, roleType);
}

/**
 * Get all viewable resources for a user
 */
export function getViewableResources(
  permissions: RolePermissions,
): (keyof RolePermissions)[] {
  const resources: (keyof RolePermissions)[] = [];

  for (const [key, value] of Object.entries(permissions)) {
    if (value && typeof value === "object" && "view" in value) {
      if ((value as { view: boolean }).view) {
        resources.push(key as keyof RolePermissions);
      }
    }
  }

  return resources;
}
