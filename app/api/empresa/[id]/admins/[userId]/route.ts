import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/app/shared/core/middleware/empresa-context';

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

async function deleteHandler(
  request: NextRequest,
  routeContext: RouteContext
) {
  try {
    const { id, userId } = await routeContext.params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);

    // Verificar se é owner em usuarios_empresas
    const { data: currentUserVinculo } = await supabase
      .from('usuarios_empresas')
      .select('is_owner')
      .eq('empresa_id', id)
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (!validateEmpresaAccess(context, id) || !currentUserVinculo?.is_owner) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas owner pode remover admins.' },
        { status: 403 }
      );
    }

    // Não permitir remover a si mesmo se for o único owner
    if (userId === user.id) {
      const { data: owners } = await supabase
        .from('usuarios_empresas')
        .select('usuario_id')
        .eq('empresa_id', id)
        .eq('is_owner', true);

      if (owners && owners.length === 1 && owners[0].usuario_id === user.id) {
        return NextResponse.json(
          { error: 'Não é possível remover o único owner da empresa' },
          { status: 400 }
        );
      }
    }

    // Remover admin: atualizar is_admin na tabela usuarios_empresas
    const { error: updateError } = await supabase
      .from('usuarios_empresas')
      .update({ is_admin: false })
      .eq('empresa_id', id)
      .eq('usuario_id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao remover admin';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/empresa/[id]/admins/[userId] - Remover admin
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return deleteHandler(request, context);
}
