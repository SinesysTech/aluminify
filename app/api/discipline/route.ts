import { NextResponse } from 'next/server';
import {
  disciplineService,
  DisciplineConflictError,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// GET é público (catálogo)
export async function GET() {
  try {
    const disciplines = await disciplineService.list();
    return NextResponse.json({ data: disciplines.map(serializeDiscipline) });
  } catch (error) {
    return handleError(error);
  }
}

// POST requer autenticação de professor (JWT ou API Key)
async function postHandler(request: AuthenticatedRequest) {
  // API Keys têm acesso total (request.apiKey existe)
  // Se for JWT, verificar se é professor ou superadmin
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const discipline = await disciplineService.create({ name: body?.name });
    return NextResponse.json({ data: serializeDiscipline(discipline) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);


