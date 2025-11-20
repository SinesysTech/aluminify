import { NextRequest, NextResponse } from 'next/server';
import {
  disciplineService,
  DisciplineConflictError,
  DisciplineNotFoundError,
  DisciplineValidationError,
} from '@/backend/services/discipline';

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
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const discipline = await disciplineService.getById(params.id);
    return NextResponse.json({ data: serializeDiscipline(discipline) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const discipline = await disciplineService.update(params.id, { name: body?.name });
    return NextResponse.json({ data: serializeDiscipline(discipline) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await disciplineService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}


