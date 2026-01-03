import { NextResponse } from 'next/server';
import {
  courseService,
  CourseConflictError,
  CourseValidationError,
} from '@/backend/services/course';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { getDatabaseClient } from '@/backend/clients/database';

const serializeCourse = (course: Awaited<ReturnType<typeof courseService.getById>>) => ({
  id: course.id,
  segmentId: course.segmentId,
  disciplineId: course.disciplineId, // Mantido para compatibilidade
  disciplineIds: course.disciplineIds, // Nova propriedade
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// GET é público (catálogo)
export async function GET() {
  try {
    const result = await courseService.list();
    const courses = Array.isArray(result) ? result : result.data;
    return NextResponse.json({ data: courses.map(serializeCourse) });
  } catch (error) {
    return handleError(error);
  }
}

// POST requer autenticação de professor (JWT ou API Key)
async function postHandler(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Resolver empresaId:
    // - Professor: sempre deriva da tabela `professores` (fonte de verdade)
    // - Superadmin: pode passar empresaId no body (ou via query param `empresa_id` se quiser)
    let empresaId: string | null = null;

    if (request.user?.role === 'superadmin') {
      empresaId =
        body?.empresaId ||
        request.nextUrl?.searchParams?.get('empresa_id') ||
        null;
    } else if (request.user?.role === 'professor') {
      const adminClient = getDatabaseClient();
      const { data: professor } = await adminClient
        .from('professores')
        .select('empresa_id')
        .eq('id', request.user.id)
        .maybeSingle();

      empresaId = professor?.empresa_id ?? null;

      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId is required (crie/vincule uma empresa antes de cadastrar cursos)' },
          { status: 400 },
        );
      }
    }

    const course = await courseService.create({
      empresaId,
      segmentId: body?.segmentId,
      disciplineId: body?.disciplineId, // Mantido para compatibilidade
      disciplineIds: body?.disciplineIds, // Nova propriedade
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
    return NextResponse.json({ data: serializeCourse(course) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);

