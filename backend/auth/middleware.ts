import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/backend/clients/database';
import { AuthUser, UserRole, ApiKeyAuth } from './types';
import { apiKeyService } from '@/backend/services/api-key';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
  apiKey?: ApiKeyAuth;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No authorization header found');
    return null;
  }

  const token = authHeader.substring(7);
  const client = getDatabaseClient();
  
  try {
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      console.log('[Auth] Error getting user:', error?.message || 'No user found');
      return null;
    }

    const role = (user.user_metadata?.role as UserRole) || 'aluno';
    const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true;

    console.log('[Auth] User authenticated:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      role,
      isSuperAdmin,
    });

    return {
      id: user.id,
      email: user.email!,
      role: isSuperAdmin ? 'superadmin' : role,
      isSuperAdmin,
    };
  } catch (err) {
    console.error('[Auth] Exception getting user:', err);
    return null;
  }
}

export async function getApiKeyAuth(request: NextRequest): Promise<ApiKeyAuth | null> {
  const apiKeyHeader = request.headers.get('x-api-key');
  
  if (!apiKeyHeader) {
    return null;
  }

  try {
    const apiKey = await apiKeyService.validateApiKey(apiKeyHeader);
    return {
      type: 'api_key',
      apiKeyId: apiKey.id,
      createdBy: apiKey.createdBy,
    };
  } catch {
    return null;
  }
}

export async function getAuth(request: NextRequest): Promise<{ user: AuthUser } | { apiKey: ApiKeyAuth } | null> {
  // Tentar primeiro JWT, depois API Key
  const user = await getAuthUser(request);
  if (user) {
    return { user };
  }

  const apiKey = await getApiKeyAuth(request);
  if (apiKey) {
    return { apiKey };
  }

  return null;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const client = getDatabaseClient();
  
  try {
    // Verificar se é professor e se tem flag de superadmin
    const { data, error } = await client
      .from('professores')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !data) {
      return false;
    }

    // Verificar metadata do usuário no auth
    const { data: { user } } = await client.auth.getUser();
    if (!user || user.id !== userId) {
      return false;
    }

    const role = (user.user_metadata?.role as UserRole) || 'aluno';
    return role === 'superadmin' || user.user_metadata?.is_superadmin === true;
  } catch {
    return false;
  }
}

export function requireAuth(
  handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const auth = await getAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    if ('user' in auth) {
      authenticatedRequest.user = auth.user;
    } else {
      authenticatedRequest.apiKey = auth.apiKey;
    }
    
    return handler(authenticatedRequest, context);
  };
}

export function requireUserAuth(
  handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    
    return handler(authenticatedRequest, context);
  };
}

export function requireRole(role: UserRole) {
  return (
    handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
  ) => {
    return async (request: NextRequest, context?: Record<string, unknown>) => {
      const user = await getAuthUser(request);
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (user.role !== role && !user.isSuperAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      
      return handler(authenticatedRequest, context);
    };
  };
}

export function requireSuperAdmin(
  handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const user = await getAuthUser(request);
    
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    
    return handler(authenticatedRequest, context);
  };
}

