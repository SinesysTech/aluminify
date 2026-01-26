import { getDatabaseClient } from '@/app/shared/core/database/database';
import { AuthUser, SignUpInput, SignInInput, AuthResponse, UserRole } from '../types';

export class AuthService {
  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const client = getDatabaseClient();
    
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role || 'aluno',
        },
      },
    });

    if (error) {
      throw new Error(`Failed to sign up: ${error.message}`);
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to create user session');
    }

    const role = (data.user.user_metadata?.role as UserRole) || 'aluno';
    const isSuperAdmin = role === 'superadmin' || data.user.user_metadata?.is_superadmin === true;

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: isSuperAdmin ? 'superadmin' : role,
        isSuperAdmin,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  async signIn(input: SignInInput): Promise<AuthResponse> {
    const client = getDatabaseClient();
    
    const { data, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new Error(`Failed to sign in: ${error.message}`);
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to create user session');
    }

    const role = (data.user.user_metadata?.role as UserRole) || 'aluno';
    const isSuperAdmin = role === 'superadmin' || data.user.user_metadata?.is_superadmin === true;

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: isSuperAdmin ? 'superadmin' : role,
        isSuperAdmin,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  async signOut(): Promise<void> {
    const client = getDatabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  async getCurrentUser(accessToken: string): Promise<AuthUser | null> {
    const client = getDatabaseClient();
    
    const { data: { user }, error } = await client.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    const role = (user.user_metadata?.role as UserRole) || 'aluno';
    const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true;

    return {
      id: user.id,
      email: user.email!,
      role: isSuperAdmin ? 'superadmin' : role,
      isSuperAdmin,
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    const client = getDatabaseClient();
    
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to refresh user session');
    }

    const role = (data.user.user_metadata?.role as UserRole) || 'aluno';
    const isSuperAdmin = role === 'superadmin' || data.user.user_metadata?.is_superadmin === true;

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: isSuperAdmin ? 'superadmin' : role,
        isSuperAdmin,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }
}

export const authService = new AuthService();

