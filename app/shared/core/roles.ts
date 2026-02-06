import type {
  PapelBase,
  RoleTipo,
  RolePermissions,
} from "@/app/shared/types/entities/papel";
import {
  ADMIN_ROLES as ADMIN_ROLE_TIPOS,
  TEACHING_ROLES as TEACHING_ROLE_TIPOS,
  DEFAULT_PERMISSIONS_BY_PAPEL_BASE,
  ADMIN_PERMISSIONS,
} from "@/app/shared/types/entities/papel";

// Default routes by papel base
const DEFAULT_ROUTE_BY_ROLE: Record<PapelBase, string> = {
  aluno: "/dashboard",
  usuario: "/dashboard",
  professor: "/dashboard",
};

// =============================================================================
// New simplified role helpers
// =============================================================================

/**
 * Check if user has a teaching role (professor)
 */
export function isTeachingRole(role: PapelBase): boolean {
  return role === "professor";
}

/**
 * Resolve effective permissions for a user based on role, admin status, and custom permissions
 * @param role - The user's base role (aluno, professor, usuario)
 * @param isAdmin - Whether the user has admin privileges
 * @param customPermissions - Optional custom permissions from a papel customizado
 */
export function resolvePermissions(
  role: PapelBase,
  isAdmin: boolean,
  customPermissions?: RolePermissions,
): RolePermissions {
  // Admins always get full permissions
  if (isAdmin) {
    return ADMIN_PERMISSIONS;
  }

  // If user has custom permissions (from a papel customizado), use those
  if (role === "usuario" && customPermissions) {
    return customPermissions;
  }

  // Otherwise use default permissions for the role
  return DEFAULT_PERMISSIONS_BY_PAPEL_BASE[role];
}

/**
 * Check if user can impersonate other users (new simplified version)
 */
export function canImpersonateUser(isAdmin: boolean): boolean {
  return isAdmin;
}

// =============================================================================
// Legacy helpers (deprecated - maintain for backwards compatibility)
// =============================================================================

/**
 * @deprecated Use isTeachingRole(role: PapelBase) instead
 */
export function isTeachingRoleTipo(tipo: RoleTipo): boolean {
  return TEACHING_ROLE_TIPOS.includes(tipo);
}

/**
 * @deprecated Use isAdmin flag directly instead
 */
export function isAdminRoleTipo(tipo: RoleTipo): boolean {
  return ADMIN_ROLE_TIPOS.includes(tipo);
}

/**
 * @deprecated Use canImpersonateUser(isAdmin) instead
 */
export function canImpersonate(
  _role: PapelBase,
  roleType?: RoleTipo,
): boolean {
  if (roleType && isAdminRoleTipo(roleType)) return true;
  return false;
}

// =============================================================================
// Permission checking helpers
// =============================================================================

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
 * Get the default route for a role
 */
export function getDefaultRouteForRole(role: PapelBase): string {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? "/dashboard";
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
