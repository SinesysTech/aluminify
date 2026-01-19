import { NextResponse } from 'next/server';
import {
  courseService,
  CourseConflictError,
  CourseValidationError,
} from '@/backend/services/course';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { getDatabaseClient, getDatabaseClientAsUser } from '@/backend/clients/database';
import type { Database } from '@/lib/database.types';

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

// GET requer autenticação para respeitar isolamento de tenant via RLS
async function getHandler(request: AuthenticatedRequest) {
  try {
    // Usar cliente com contexto do usuário para respeitar RLS
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    const client = getDatabaseClientAsUser(token);

    // Query cursos com disciplinas associadas
    const { data, error } = await client
      .from("cursos")
      .select(`
        id,
        segmento_id,
        disciplina_id,
        nome,
        modalidade,
        tipo,
        descricao,
        ano_vigencia,
        data_inicio,
        data_termino,
        meses_acesso,
        planejamento_url,
        imagem_capa_url,
        created_at,
        updated_at,
        cursos_disciplinas (disciplina_id)
      `)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar cursos: ${error.message}`);
    }

    const response = NextResponse.json({
      data: (data || []).map((c) => ({
        id: c.id,
        segmentId: c.segmento_id,
        disciplineId: c.disciplina_id,
        disciplineIds: c.cursos_disciplinas?.map((cd: { disciplina_id: string }) => cd.disciplina_id) || [],
        name: c.nome,
        modality: c.modalidade,
        type: c.tipo,
        description: c.descricao,
        year: c.ano_vigencia,
        startDate: c.data_inicio,
        endDate: c.data_termino,
        accessMonths: c.meses_acesso,
        planningUrl: c.planejamento_url,
        coverImageUrl: c.imagem_capa_url,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    });

    // Cache privado pois é específico do usuário/tenant
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120",
    );

    return response;
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);

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
    // - API Key: deriva do `createdBy` da API key (que deve ser um professor)
    let empresaId: string | null = null;

    if (request.user?.role === 'superadmin') {
      empresaId =
        body?.empresaId ||
        request.nextUrl?.searchParams?.get('empresa_id') ||
        null;

      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId is required (informe empresaId ao criar curso como superadmin)' },
          { status: 400 },
        );
      }
    } else if (request.user?.role === 'professor') {
      const adminClient = getDatabaseClient();
      const { data: professor } = await adminClient
        .from('professores')
        .select('empresa_id')
        .eq('id', request.user.id)
        .maybeSingle();

      // Type assertion: Query result properly typed from Database schema
      type ProfessorEmpresa = Pick<Database['public']['Tables']['professores']['Row'], 'empresa_id'>;
      const typedProfessor = professor as ProfessorEmpresa | null;

      empresaId = typedProfessor?.empresa_id ?? null;

      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId is required (crie/vincule uma empresa antes de cadastrar cursos)' },
          { status: 400 },
        );
      }
    } else if (request.apiKey?.createdBy) {
      const adminClient = getDatabaseClient();
      const { data: professor } = await adminClient
        .from('professores')
        .select('empresa_id')
        .eq('id', request.apiKey.createdBy)
        .maybeSingle();

      // Type assertion: Query result properly typed from Database schema
      type ProfessorEmpresa = Pick<Database['public']['Tables']['professores']['Row'], 'empresa_id'>;
      const typedProfessor = professor as ProfessorEmpresa | null;

      empresaId = typedProfessor?.empresa_id ?? null;

      if (!empresaId) {
        return NextResponse.json(
          { error: 'empresaId is required (API key não está vinculada a um professor com empresa)' },
          { status: 400 },
        );
      }
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId is required (não foi possível resolver a empresa do curso)' },
        { status: 400 },
      );
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

