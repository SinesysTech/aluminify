import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/backend/clients/database';
import { AuthUser, UserRole } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const client = getDatabaseClient();
  
  try {
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const role = (user.user_metadata?.role as UserRole) || 'aluno';

    return {
      id: user.id,
      email: user.email!,
      role,
    };
  } catch {
    return null;
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    
    return handler(authenticatedRequest);
  };
}

export function requireRole(role: UserRole) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const user = await getAuthUser(request);
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (user.role !== role) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      
      return handler(authenticatedRequest);
    };
  };
}

