import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/app/shared/core/middleware/empresa-context';
import type { Database } from '@/app/shared/core/database.types';

interface RouteContext {
  params: Promise<{ id: string; professorId: string }>;
}

// PATCH /api/empresas/[id]/professores/[professorId] - Atualizar professor (toggle admin, etc)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id, professorId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa pode atualizar professores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'isAdmin deve ser um booleano' },
        { status: 400 }
      );
    }

    // Verificar se o professor pertence à empresa
    const { data: professor, error: fetchError } = await supabase
      .from('professores')
      .select('id, empresa_id')
      .eq('id', professorId)
      .single();

    // Type assertion: Query result properly typed from Database schema
    type ProfessorEmpresa = Pick<Database['public']['Tables']['professores']['Row'], 'id' | 'empresa_id'>;
    const typedProfessor = professor as ProfessorEmpresa | null;

    if (fetchError || !typedProfessor) {
      return NextResponse.json(
        { error: 'Professor não encontrado' },
        { status: 404 }
      );
    }

    if (typedProfessor.empresa_id !== id) {
      return NextResponse.json(
        { error: 'Professor não pertence a esta empresa' },
        { status: 403 }
      );
    }

    // Atualizar o campo is_admin na tabela professores
    const { error: updateError } = await supabase
      .from('professores')
      .update({ is_admin: isAdmin })
      .eq('id', professorId);

    if (updateError) {
      throw updateError;
    }

    // Também atualizar no user_metadata do auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      professorId,
      {
        user_metadata: {
          is_admin: isAdmin,
        },
      }
    );

    if (authError) {
      console.error('Error updating auth user metadata:', authError);
      // Não falhar a request por isso, pois a tabela foi atualizada
    }

    return NextResponse.json({ success: true, isAdmin });
  } catch (error) {
    console.error('Error updating professor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar professor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
