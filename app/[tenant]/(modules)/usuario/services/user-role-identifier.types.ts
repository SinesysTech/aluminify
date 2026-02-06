import type { PapelBase } from '@/app/shared/types';
import type { RoleTipo, RolePermissions } from '@/app/shared/types/entities/papel';

/**
 * Result of identifying user roles
 */
export interface UserRoleIdentification {
  userId: string;
  roles: PapelBase[];
  primaryRole: PapelBase;
  empresaIds: string[];
  /** Detailed info about each role */
  roleDetails: UserRoleDetail[];
}

/**
 * Detailed info about a user role
 */
export interface UserRoleDetail {
  role: PapelBase;
  empresaId: string;
  empresaNome: string;
  empresaSlug: string;
  /** Whether user is admin for this empresa */
  isAdmin?: boolean;
  /** Specific role type (only for role="usuario") */
  roleType?: RoleTipo;
  /** Role permissions (only for role="usuario") */
  permissions?: RolePermissions;
}

/**
 * Options for identifying user roles
 */
export interface IdentifyRolesOptions {
  /** If provided, only check roles for this empresa */
  empresaId?: string;
  /** Include detailed info about each role */
  includeDetails?: boolean;
}

/**
 * Result of role switching
 */
export interface SwitchRoleResult {
  success: boolean;
  newRole: PapelBase;
  empresaId?: string;
  error?: string;
}
