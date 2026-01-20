import type { RoleTipo, RolePermissions } from "@/types/shared/entities/papel";

// Main app roles (simplified)
// - aluno: student
// - usuario: institution staff (professor, admin, staff, monitor)
// - superadmin: system administrator
export type UserRole = "aluno" | "usuario" | "superadmin";

// Legacy roles (for compatibility during migration)
export type LegacyUserRole = "aluno" | "professor" | "superadmin" | "empresa";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  // Specific role type (only for role="usuario")
  roleType?: RoleTipo;
  // Role permissions
  permissions?: RolePermissions;
  isSuperAdmin?: boolean;
  // Deprecated: use permissions.usuarios instead
  isAdmin?: boolean;
  empresaId?: string;
}

export interface ApiKeyAuth {
  type: "api_key";
  apiKeyId: string;
  createdBy: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: {
    accessToken: string;
    refreshToken: string;
  };
}
