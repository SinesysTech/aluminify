import { NextRequest, NextResponse } from 'next/server';
import {
  courseService,
  CourseConflictError,
  CourseNotFoundError,
  CourseValidationError,
} from '@/backend/services/course';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeCourse = (course: Awaited<ReturnType<typeof courseService.getById>>) => ({
  id: course.id,
  segmentId: course.segmentId,
  disciplineId: course.disciplineId,
  name: course.name,
  modality: course.modality,
  type: course.type,
  description: course.description,
  year: course.year,
  startDate: course.startDate?.toISOString().split('T')[0] ?? null,
  endDate: course.endDate?.toISOString().split('T')[0] ?? null,
  accessMonths: course.accessMonths,
  planningUrl: course.planningUrl,
  coverImageUrl: course.coverImageUrl,
  createdAt: course.createdAt.toISOString(),
  updatedAt: course.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof CourseValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof CourseConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof CourseNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: { id: string };
}

// GET é público (catálogo)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const course = await courseService.getById(params.id);
    return NextResponse.json({ data: serializeCourse(course) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function putHandler(request: AuthenticatedRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const course = await courseService.update(params.id, {
      segmentId: body?.segmentId,
      disciplineId: body?.disciplineId,
      name: body?.name,
      modality: body?.modality,
      type: body?.type,
      description: body?.description,
      year: body?.year,
      startDate: body?.startDate,
      endDate: body?.endDate,
      accessMonths: body?.accessMonths,
      planningUrl: body?.planningUrl,
      coverImageUrl: body?.coverImageUrl,
    });
    return NextResponse.json({ data: serializeCourse(course) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function deleteHandler(_request: AuthenticatedRequest, { params }: RouteContext) {
  try {
    await courseService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return requireAuth((req) => putHandler(req, context))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return requireAuth((req) => deleteHandler(req, context))(request);
}

