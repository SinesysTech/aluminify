import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { getDatabaseClient } from '@/backend/clients/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getEnrollmentsHandler(request: AuthenticatedRequest, courseId: string) {
  try {
    const db = getDatabaseClient();
    const empresaId = request.user?.empresaId;

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não identificada' }, { status: 400 });
    }

    // Get enrollments with student data
    const { data: enrollments, error } = await db
      .from('matriculas')
      .select(`
        id,
        data_matricula,
        data_inicio_acesso,
        data_fim_acesso,
        ativo,
        aluno:alunos (
          id,
          nome_completo,
          email,
          telefone,
          cidade,
          estado
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('curso_id', courseId)
      .order('data_matricula', { ascending: false });

    if (error) {
      console.error('[Enrollments API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get course info
    const { data: course, error: courseError } = await db
      .from('cursos')
      .select('id, nome, modalidade, tipo, ano_vigencia')
      .eq('id', courseId)
      .eq('empresa_id', empresaId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    const serializedEnrollments = enrollments?.map((e: {
      id: string;
      data_matricula: string;
      data_inicio_acesso: string | null;
      data_fim_acesso: string | null;
      ativo: boolean;
      aluno: unknown;
    }) => ({
      id: e.id,
      enrollmentDate: e.data_matricula,
      startDate: e.data_inicio_acesso,
      endDate: e.data_fim_acesso,
      active: e.ativo,
      student: e.aluno ? {
        id: (e.aluno as { id: string }).id,
        name: (e.aluno as { nome_completo: string }).nome_completo,
        email: (e.aluno as { email: string }).email,
        phone: (e.aluno as { telefone: string | null }).telefone,
        city: (e.aluno as { cidade: string | null }).cidade,
        state: (e.aluno as { estado: string | null }).estado,
      } : null,
    })) || [];

    return NextResponse.json({
      data: {
        course: {
          id: course.id,
          name: course.nome,
          modality: course.modalidade,
          type: course.tipo,
          year: course.ano_vigencia,
        },
        enrollments: serializedEnrollments,
        total: serializedEnrollments.length,
      },
    });
  } catch (error) {
    console.error('[Enrollments API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => getEnrollmentsHandler(req, params.id))(request);
}
