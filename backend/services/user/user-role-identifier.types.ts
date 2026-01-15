import type { AppUserRole } from '@/types/shared';

/**
 * Result of identifying user roles
 */
export interface UserRoleIdentification {
  userId: string;
  roles: Array<Exclude<AppUserRole, 'empresa'>>;
  primaryRole: Exclude<AppUserRole, 'empresa'>;
  empresaIds: string[];
  /** Detailed info about each role */
  roleDetails: UserRoleDetail[];
}

/**
 * Detailed info about a user role
 */
export interface UserRoleDetail {
  role: Exclude<AppUserRole, 'empresa'>;
  empresaId: string;
  empresaNome: string;
  empresaSlug: string;
  /** Whether user is admin for this empresa (professors only) */
  isAdmin?: boolean;
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
  newRole: AppUserRole;
  empresaId?: string;
  error?: string;
}
