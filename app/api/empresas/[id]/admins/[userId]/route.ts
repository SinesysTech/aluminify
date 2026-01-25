import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

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
    
    // Verificar se é owner ou superadmin
    const { data: isOwner } = await supabase
      .from('empresa_admins')
      .select('is_owner')
      .eq('empresa_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!context.isSuperAdmin && (!validateEmpresaAccess(context, id) || !isOwner?.is_owner)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas owner ou superadmin pode remover admins.' },
        { status: 403 }
      );
    }

    // Não permitir remover a si mesmo se for o único owner
    if (userId === user.id) {
      const { data: owners } = await supabase
        .from('empresa_admins')
        .select('user_id')
        .eq('empresa_id', id)
        .eq('is_owner', true);

      if (owners && owners.length === 1 && owners[0].user_id === user.id) {
        return NextResponse.json(
          { error: 'Não é possível remover o único owner da empresa' },
          { status: 400 }
        );
      }
    }

    // Remover de empresa_admins
    const { error: deleteError } = await supabase
      .from('empresa_admins')
      .delete()
      .eq('empresa_id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Atualizar is_admin na tabela professores
    await supabase
      .from('professores')
      .update({ is_admin: false })
      .eq('id', userId);

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

// DELETE /api/empresas/[id]/admins/[userId] - Remover admin
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return deleteHandler(request, context);
}

