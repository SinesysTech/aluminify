import { NextRequest, NextResponse } from 'next/server';
import {
  disciplineService,
  DisciplineConflictError,
  DisciplineNotFoundError,
  DisciplineValidationError,
} from '@/backend/services/discipline';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeDiscipline = (discipline: Awaited<ReturnType<typeof disciplineService.getById>>) => ({
  id: discipline.id,
  name: discipline.name,
  createdAt: discipline.createdAt.toISOString(),
  updatedAt: discipline.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof DisciplineValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof DisciplineConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof DisciplineNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET é público (catálogo)
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const discipline = await disciplineService.getById(params.id);
    return NextResponse.json({ data: serializeDiscipline(discipline) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function putHandler(request: AuthenticatedRequest, params: { id: string }) {
  try {
    const body = await request.json();
    const discipline = await disciplineService.update(params.id, { name: body?.name });
    return NextResponse.json({ data: serializeDiscipline(discipline) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function deleteHandler(_request: AuthenticatedRequest, params: { id: string }) {
  try {
    await disciplineService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => putHandler(req, params))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}


