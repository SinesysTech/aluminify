import type {
  RoleTipo,
  RolePermissions,
} from "@/app/shared/types/entities/papel";

// Main app roles (simplified)
// - aluno: student
// - usuario: institution staff (professor, admin, staff, monitor)
export type UserRole = "aluno" | "usuario";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  // Specific role type (only for role="usuario")
  roleType?: RoleTipo;
  // Role permissions
  permissions?: RolePermissions;
  isAdmin?: boolean;
  empresaId?: string;
  name?: string;
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
