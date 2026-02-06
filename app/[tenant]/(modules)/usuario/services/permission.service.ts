/**
 * Permission Service
 *
 * Provides permission checking methods for the RBAC system.
 * Centralizes all permission-related logic for consistent access control.
 *
 * NEW MODEL (simplified):
 * - Use `isAdmin` boolean flag instead of RoleTipo for admin checks
 * - Permissions are resolved via resolvePermissions(role, isAdmin, customPerms)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type { PapelBase } from "@/app/shared/types";
import type {
  RolePermissions,
  ResourcePermissions,
  SimplePermissions,
  RoleTipo,
} from "@/app/shared/types/entities/papel";
import { resolvePermissions } from "@/app/shared/core/roles";

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

// User context for permission checks (new model)
export interface PermissionContext {
  userId: string;
  empresaId: string;
  permissions: RolePermissions;
  /** User's base role */
  role: PapelBase;
  /** Whether user has admin privileges (from usuarios_empresas.is_admin) */
  isAdmin: boolean;
  /**
   * @deprecated Use isAdmin flag instead.
   * roleTipo is being phased out in favor of isAdmin boolean.
   */
  roleTipo?: RoleTipo;
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

  // Role checks (new simplified model)
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
   * Check if user has admin privileges
   * Uses the isAdmin flag from usuarios_empresas (new model)
   */
  isAdmin(context: PermissionContext): boolean {
    return context.isAdmin;
  }

  /**
   * Check if user has a teaching role (can have disciplinas)
   * Uses the role (PapelBase) field (new model)
   */
  isTeachingRole(context: PermissionContext): boolean {
    return context.role === "professor";
  }

  /**
   * Get user permissions from database
   * Uses the new model: fetches isAdmin from usuarios_empresas and resolves permissions
   */
  async getUserPermissions(userId: string): Promise<PermissionContext | null> {
    // Fetch user with empresa link and optional papel
    const { data, error } = await this.client
      .from("usuarios")
      .select(
        `
        id,
        empresa_id,
        papel_id,
        papeis (tipo, permissoes),
        usuarios_empresas!inner (
          papel_base,
          is_admin
        )
      `,
      )
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

    // Extract vinculo data
    const vinculoRaw = data.usuarios_empresas as
      | { papel_base: string; is_admin: boolean }
      | { papel_base: string; is_admin: boolean }[];
    const vinculo = Array.isArray(vinculoRaw) ? vinculoRaw[0] : vinculoRaw;

    const role = (vinculo?.papel_base ?? "usuario") as PapelBase;
    const isAdmin = vinculo?.is_admin ?? false;

    // Get custom permissions from papel if exists
    let customPermissions: RolePermissions | undefined;
    let roleTipo: RoleTipo | undefined;

    if (data.papeis) {
      const papelRaw = data.papeis as
        | { tipo: string | null; permissoes: unknown }
        | { tipo: string | null; permissoes: unknown }[];
      const papel = Array.isArray(papelRaw) ? papelRaw[0] : papelRaw;

      if (papel?.permissoes && this.validatePermissions(papel.permissoes)) {
        customPermissions = papel.permissoes;
      }
      if (papel?.tipo) {
        roleTipo = papel.tipo as RoleTipo;
      }
    }

    // Resolve effective permissions using the new model
    const permissions = resolvePermissions(role, isAdmin, customPermissions);

    return {
      userId: data.id,
      empresaId: data.empresa_id,
      permissions,
      role,
      isAdmin,
      roleTipo, // deprecated, kept for compatibility
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
 * @deprecated Use isAdmin flag from usuarios_empresas instead.
 * Check if a role type is an admin role (legacy)
 */
export function isAdminRole(tipo: RoleTipo): boolean {
  return tipo === "admin" || tipo === "professor_admin";
}

/**
 * @deprecated Use role === "professor" check instead.
 * Check if a role type is a teaching role (legacy)
 */
export function isTeachingRoleByTipo(tipo: RoleTipo): boolean {
  return (
    tipo === "professor" || tipo === "professor_admin" || tipo === "monitor"
  );
}

/**
 * Check if a role is a teaching role (new model)
 */
export function isTeachingRole(role: PapelBase): boolean {
  return role === "professor";
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
