// @ts-nocheck - Temporary: Supabase types need to be regenerated after new migrations
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { StudentRepositoryImpl } from '@/backend/services/student';
import { getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa pode ver alunos.' },
        { status: 403 }
      );
    }

    const repository = new StudentRepositoryImpl(supabase);
    const alunos = await repository.findByEmpresa(id);

    return NextResponse.json(alunos);
  } catch (error) {
    console.error('Error listing alunos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar alunos' },
      { status: 500 }
    );
  }
}

// GET /api/empresas/[id]/alunos - Listar alunos matriculados em cursos da empresa
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  return getHandler(request, params);
}
