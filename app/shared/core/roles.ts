import type { AppUserRole } from "@/app/shared/types/entities/user";
import type { RoleTipo, RolePermissions } from "@/app/shared/types/entities/papel";
import {
  ADMIN_ROLES as ADMIN_ROLE_TIPOS,
  TEACHING_ROLES as TEACHING_ROLE_TIPOS,
} from "@/app/shared/types/entities/papel";

// Default routes by main role
const DEFAULT_ROUTE_BY_ROLE: Record<AppUserRole, string> = {
  aluno: "/dashboard",
  usuario: "/dashboard",
  superadmin: "/superadmin/dashboard",
  professor: "/dashboard",
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
 * Get the default route for a role
 */
export function getDefaultRouteForRole(role: AppUserRole): string {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? "/dashboard";
}

/**
 * Check if user can impersonate other users
 */
export function canImpersonate(
  role: AppUserRole,
  roleType?: RoleTipo,
): boolean {
  if (role === "superadmin") return true;
  if (roleType && isAdminRoleTipo(roleType)) return true;
  return false;
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
