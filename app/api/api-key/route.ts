import { NextResponse } from 'next/server';
import {
  apiKeyService,
  ApiKeyValidationError,
} from '@/backend/services/api-key';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeApiKey = (apiKey: Awaited<ReturnType<typeof apiKeyService.getById>>) => ({
  id: apiKey.id,
  name: apiKey.name,
  createdBy: apiKey.createdBy,
  lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
  expiresAt: apiKey.expiresAt?.toISOString() ?? null,
  active: apiKey.active,
  createdAt: apiKey.createdAt.toISOString(),
  updatedAt: apiKey.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof ApiKeyValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

async function handler(request: AuthenticatedRequest) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Apenas professores podem criar API keys
  if (request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (request.method === 'GET') {
    try {
      const apiKeys = await apiKeyService.list(request.user.id);
      return NextResponse.json({ data: apiKeys.map(serializeApiKey) });
    } catch (error) {
      return handleError(error);
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const result = await apiKeyService.create(
        {
          name: body?.name,
          expiresAt: body?.expiresAt,
        },
        request.user.id,
      );

      // Retornar a chave plain apenas na criação
      return NextResponse.json(
        {
          data: {
            ...serializeApiKey(result),
            key: result.plainKey, // Apenas aqui, nunca mais será retornado
          },
        },
        { status: 201 },
      );
    } catch (error) {
      return handleError(error);
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = requireUserAuth(handler);
export const POST = requireUserAuth(handler);

