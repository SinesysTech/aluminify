import { NextRequest, NextResponse } from 'next/server';
import {
  apiKeyService,
  ApiKeyNotFoundError,
  ApiKeyValidationError,
} from '@/app/shared/core/services/api-key';
import { requireUserAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';

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

  if (error instanceof ApiKeyNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = await apiKeyService.getById(params.id);
    
    // Verificar se o usuário é o dono da API key ou superadmin
    if (apiKey.createdBy !== request.user.id && request.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: serializeApiKey(apiKey) });
  } catch (error) {
    return handleError(error);
  }
}

async function putHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = await apiKeyService.getById(params.id);
    
    // Verificar se o usuário é o dono da API key ou superadmin
    if (apiKey.createdBy !== request.user.id && request.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await apiKeyService.update(params.id, {
      name: body?.name,
      active: body?.active,
      expiresAt: body?.expiresAt,
    });
    return NextResponse.json({ data: serializeApiKey(updated) });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = await apiKeyService.getById(params.id);
    
    // Verificar se o usuário é o dono da API key ou superadmin
    if (apiKey.createdBy !== request.user.id && request.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await apiKeyService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => getHandler(req, params))(request);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => putHandler(req, params))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => deleteHandler(req, params))(request);
}
