/**
 * Permission Service
 *
 * Provides permission checking methods for the RBAC system.
 * Centralizes all permission-related logic for consistent access control.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type {
  RolePermissions,
  ResourcePermissions,
  SimplePermissions,
  RoleTipo,
} from "@/types/shared/entities/papel";
import { ADMIN_ROLES, TEACHING_ROLES } from "@/types/shared/entities/papel";

// Resource names that map to RolePermissions keys
export type ResourceName = keyof RolePermissions;

// Action types for resources
export type ResourceAction = "view" | "create" | "edit" | "delete";
export type SimpleAction = "view" | "edit";

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// User context for permission checks
export interface PermissionContext {
  userId: string;
  empresaId: string;
  permissions: RolePermissions;
  roleTipo: RoleTipo;
}

export interface PermissionService {
  // Core permission checks
  canAccess(
    context: PermissionContext,
    resource: ResourceName,
    action: ResourceAction | SimpleAction,
  ): boolean;

  canView(context: PermissionContext, resource: ResourceName): boolean;
  canCreate(context: PermissionContext, resource: ResourceName): boolean;
  canEdit(context: PermissionContext, resource: ResourceName): boolean;
  canDelete(context: PermissionContext, resource: ResourceName): boolean;

  // Role type checks
  isAdmin(context: PermissionContext): boolean;
  isTeachingRole(context: PermissionContext): boolean;

  // Get user permissions from database
  getUserPermissions(userId: string): Promise<PermissionContext | null>;

  // Validate permission structure
  validatePermissions(permissions: unknown): permissions is RolePermissions;
}

export class PermissionServiceImpl implements PermissionService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * Check if user can perform an action on a resource
   */
  canAccess(
    context: PermissionContext,
    resource: ResourceName,
    action: ResourceAction | SimpleAction,
  ): boolean {
    const resourcePermissions = context.permissions[resource];

    if (!resourcePermissions) {
      return false;
    }

    // Handle different permission structures
    if (this.isResourcePermissions(resourcePermissions)) {
      return resourcePermissions[action as keyof ResourcePermissions] ?? false;
    }

    if (this.isSimplePermissions(resourcePermissions)) {
      if (action === "view") {
        return resourcePermissions.view;
      }
      if (action === "edit") {
        return resourcePermissions.edit ?? false;
      }
      // Simple permissions don't support create/delete
      return false;
    }

    // Dashboard-style permission (only view)
    if ("view" in resourcePermissions && action === "view") {
      return (resourcePermissions as { view: boolean }).view;
    }

    return false;
  }

  canView(context: PermissionContext, resource: ResourceName): boolean {
    return this.canAccess(context, resource, "view");
  }

  canCreate(context: PermissionContext, resource: ResourceName): boolean {
    return this.canAccess(context, resource, "create");
  }

  canEdit(context: PermissionContext, resource: ResourceName): boolean {
    return this.canAccess(context, resource, "edit");
  }

  canDelete(context: PermissionContext, resource: ResourceName): boolean {
    return this.canAccess(context, resource, "delete");
  }

  /**
   * Check if user has admin role
   */
  isAdmin(context: PermissionContext): boolean {
    return ADMIN_ROLES.includes(context.roleTipo);
  }

  /**
   * Check if user has a teaching role (can have disciplinas)
   */
  isTeachingRole(context: PermissionContext): boolean {
    return TEACHING_ROLES.includes(context.roleTipo);
  }

  /**
   * Get user permissions from database
   */
  async getUserPermissions(userId: string): Promise<PermissionContext | null> {
    const { data, error } = await this.client
      .from("usuarios")
      .select("id, empresa_id, papeis!inner(tipo, permissoes)")
      .eq("id", userId)
      .eq("ativo", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get user permissions: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const papelData = data.papeis as { tipo: string; permissoes: unknown };

    if (!this.validatePermissions(papelData.permissoes)) {
      throw new Error("Invalid permission structure in database");
    }

    return {
      userId: data.id,
      empresaId: data.empresa_id,
      permissions: papelData.permissoes,
      roleTipo: papelData.tipo as RoleTipo,
    };
  }

  /**
   * Validate that a permissions object has the correct structure
   */
  validatePermissions(permissions: unknown): permissions is RolePermissions {
    if (!permissions || typeof permissions !== "object") {
      return false;
    }

    const p = permissions as Record<string, unknown>;

    // Check required top-level keys
    const requiredKeys = [
      "dashboard",
      "cursos",
      "disciplinas",
      "alunos",
      "usuarios",
      "agendamentos",
      "configuracoes",
      "relatorios",
    ];

    for (const key of requiredKeys) {
      if (!(key in p)) {
        return false;
      }
    }

    return true;
  }

  // Type guards
  private isResourcePermissions(obj: unknown): obj is ResourcePermissions {
    if (!obj || typeof obj !== "object") return false;
    const o = obj as Record<string, unknown>;
    return (
      "view" in o &&
      "create" in o &&
      "edit" in o &&
      "delete" in o &&
      typeof o.view === "boolean" &&
      typeof o.create === "boolean" &&
      typeof o.edit === "boolean" &&
      typeof o.delete === "boolean"
    );
  }

  private isSimplePermissions(obj: unknown): obj is SimplePermissions {
    if (!obj || typeof obj !== "object") return false;
    const o = obj as Record<string, unknown>;
    return (
      "view" in o &&
      typeof o.view === "boolean" &&
      !("create" in o) &&
      !("delete" in o)
    );
  }
}

// Helper functions for use outside of class context

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  permissions: RolePermissions,
  resource: ResourceName,
  action: ResourceAction | SimpleAction,
): boolean {
  const resourcePermissions = permissions[resource];

  if (!resourcePermissions) {
    return false;
  }

  if (action in resourcePermissions) {
    return (resourcePermissions as Record<string, boolean>)[action] ?? false;
  }

  return false;
}

/**
 * Check if a role type is an admin role
 */
export function isAdminRole(tipo: RoleTipo): boolean {
  return tipo === "admin" || tipo === "professor_admin";
}

/**
 * Check if a role type is a teaching role
 */
export function isTeachingRole(tipo: RoleTipo): boolean {
  return (
    tipo === "professor" || tipo === "professor_admin" || tipo === "monitor"
  );
}

/**
 * Get all resources a user can view
 */
export function getViewableResources(
  permissions: RolePermissions,
): ResourceName[] {
  const resources: ResourceName[] = [];

  for (const [key, value] of Object.entries(permissions)) {
    if (value && typeof value === "object" && "view" in value) {
      if ((value as { view: boolean }).view) {
        resources.push(key as ResourceName);
      }
    }
  }

  return resources;
}

/**
 * Merge two permission objects (for customization)
 */
export function mergePermissions(
  base: RolePermissions,
  overrides: Partial<RolePermissions>,
): RolePermissions {
  const result = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && key in result) {
      (result as Record<string, unknown>)[key] = {
        ...result[key as keyof RolePermissions],
        ...value,
      };
    }
  }

  return result;
}
