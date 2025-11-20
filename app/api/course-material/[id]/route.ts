import { NextRequest, NextResponse } from 'next/server';
import {
  courseMaterialService,
  CourseMaterialNotFoundError,
  CourseMaterialValidationError,
} from '@/backend/services/course-material';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeCourseMaterial = (
  material: Awaited<ReturnType<typeof courseMaterialService.getById>>,
) => ({
  id: material.id,
  courseId: material.courseId,
  title: material.title,
  description: material.description,
  type: material.type,
  fileUrl: material.fileUrl,
  order: material.order,
  createdAt: material.createdAt.toISOString(),
  updatedAt: material.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof CourseMaterialValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof CourseMaterialNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: { id: string };
}

// GET - RLS filtra automaticamente (alunos veem apenas materiais de cursos matriculados)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const material = await courseMaterialService.getById(params.id);
    return NextResponse.json({ data: serializeCourseMaterial(material) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação de professor (JWT ou API Key) - RLS verifica permissões
async function putHandler(request: AuthenticatedRequest, { params }: RouteContext) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const material = await courseMaterialService.update(params.id, {
      title: body?.title,
      description: body?.description,
      type: body?.type,
      fileUrl: body?.fileUrl,
      order: body?.order,
    });
    return NextResponse.json({ data: serializeCourseMaterial(material) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE requer autenticação de professor (JWT ou API Key) - RLS verifica permissões
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteContext) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await courseMaterialService.delete(params.id);
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

