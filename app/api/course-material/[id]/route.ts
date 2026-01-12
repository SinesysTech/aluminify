import { NextRequest, NextResponse } from 'next/server';
import {
  courseMaterialService,
  CourseMaterialNotFoundError,
  CourseMaterialValidationError,
  createCourseMaterialService,
} from '@/backend/services/course-material';
import {
  requireAuth,
  requireUserAuth,
  AuthenticatedRequest,
} from '@/backend/auth/middleware';
import { getDatabaseClient, getDatabaseClientAsUser } from '@/backend/clients/database';

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
  params: Promise<{ id: string }>;
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7).trim() || null;
}

// GET - exige JWT para aplicar RLS (alunos veem apenas materiais de cursos matriculados)
async function getHandler(request: AuthenticatedRequest, params: { id: string }) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = getDatabaseClientAsUser(token);
    const userScopedService = createCourseMaterialService(userClient);
    const material = await userScopedService.getById(params.id);
    return NextResponse.json({ data: serializeCourseMaterial(material) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação de professor (JWT ou API Key) - RLS verifica permissões
async function putHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const token = getBearerToken(request);

    // JWT: usar client user-scoped (RLS faz a validação)
    if (request.user && token) {
      const userClient = getDatabaseClientAsUser(token);
      const userScopedService = createCourseMaterialService(userClient);
      const material = await userScopedService.update(params.id, {
        title: body?.title,
        description: body?.description,
        type: body?.type,
        fileUrl: body?.fileUrl,
        order: body?.order,
      });
      return NextResponse.json({ data: serializeCourseMaterial(material) });
    }

    // API Key: validar tenant manualmente (service role bypassa RLS)
    if (request.apiKey) {
      const db = getDatabaseClient();

      const { data: professor, error: profError } = await db
        .from('professores')
        .select('empresa_id')
        .eq('id', request.apiKey.createdBy)
        .maybeSingle();

      if (profError) throw new Error(`Falha ao validar professor da API key: ${profError.message}`);

      const empresaId = (professor as { empresa_id?: string | null } | null)?.empresa_id ?? null;
      if (!empresaId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Garantir que o material pertence à empresa do criador da chave
      const { data: scopedMaterial, error: scopedErr } = await db
        .from('materiais_curso')
        .select('id')
        .eq('id', params.id)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (scopedErr) throw new Error(`Falha ao validar material: ${scopedErr.message}`);
      if (!scopedMaterial) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const material = await courseMaterialService.update(params.id, {
        title: body?.title,
        description: body?.description,
        type: body?.type,
        fileUrl: body?.fileUrl,
        order: body?.order,
      });
      return NextResponse.json({ data: serializeCourseMaterial(material) });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE requer autenticação de professor (JWT ou API Key) - RLS verifica permissões
async function deleteHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const token = getBearerToken(request);

    // JWT: usar client user-scoped (RLS faz a validação)
    if (request.user && token) {
      const userClient = getDatabaseClientAsUser(token);
      const userScopedService = createCourseMaterialService(userClient);
      await userScopedService.delete(params.id);
      return NextResponse.json({ success: true });
    }

    // API Key: validar tenant manualmente (service role bypassa RLS)
    if (request.apiKey) {
      const db = getDatabaseClient();

      const { data: professor, error: profError } = await db
        .from('professores')
        .select('empresa_id')
        .eq('id', request.apiKey.createdBy)
        .maybeSingle();

      if (profError) throw new Error(`Falha ao validar professor da API key: ${profError.message}`);

      const empresaId = (professor as { empresa_id?: string | null } | null)?.empresa_id ?? null;
      if (!empresaId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Garantir que o material pertence à empresa do criador da chave
      const { data: scopedMaterial, error: scopedErr } = await db
        .from('materiais_curso')
        .select('id')
        .eq('id', params.id)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (scopedErr) throw new Error(`Falha ao validar material: ${scopedErr.message}`);
      if (!scopedMaterial) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      await courseMaterialService.delete(params.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => getHandler(req, params))(request);
}

