import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { StudentRepositoryImpl } from '@/backend/services/student';
import { getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

// GET /api/empresas/[id]/alunos - Listar alunos matriculados em cursos da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, params.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa pode ver alunos.' },
        { status: 403 }
      );
    }

    const repository = new StudentRepositoryImpl(supabase);
    const alunos = await repository.findByEmpresa(params.id);

    return NextResponse.json(alunos);
  } catch (error) {
    console.error('Error listing alunos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar alunos' },
      { status: 500 }
    );
  }
}

