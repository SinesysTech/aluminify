export type UserRole = 'aluno' | 'professor' | 'superadmin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean;
}

export interface ApiKeyAuth {
  type: 'api_key';
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

