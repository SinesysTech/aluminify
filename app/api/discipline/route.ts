import { NextRequest, NextResponse } from 'next/server';
import {
  disciplineService,
  DisciplineConflictError,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const disciplines = await disciplineService.list();
    return NextResponse.json({ data: disciplines.map(serializeDiscipline) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const discipline = await disciplineService.create({ name: body?.name });
    return NextResponse.json({ data: serializeDiscipline(discipline) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}


