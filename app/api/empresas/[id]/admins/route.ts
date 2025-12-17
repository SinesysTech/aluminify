import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

// GET /api/empresas/[id]/admins - Listar admins da empresa
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
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { data: admins, error } = await supabase
      .from('empresa_admins')
      .select('*, professores:user_id(*)')
      .eq('empresa_id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error listing admins:', error);
    return NextResponse.json(
      { error: 'Erro ao listar admins' },
      { status: 500 }
    );
  }
}

// POST /api/empresas/[id]/admins - Adicionar admin
export async function POST(
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

    const body = await request.json();
    const { professorId } = body;

    if (!professorId) {
      return NextResponse.json(
        { error: 'professorId é obrigatório' },
        { status: 400 }
      );
    }

    const context = await getEmpresaContext(supabase, user.id, request);
    
    // Verificar se é owner ou superadmin
    const { data: isOwner } = await supabase
      .from('empresa_admins')
      .select('is_owner')
      .eq('empresa_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!context.isSuperAdmin && (!validateEmpresaAccess(context, params.id) || !isOwner?.is_owner)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas owner ou superadmin pode adicionar admins.' },
        { status: 403 }
      );
    }

    // Verificar se professor pertence à empresa
    const { data: professor } = await supabase
      .from('professores')
      .select('empresa_id')
      .eq('id', professorId)
      .eq('empresa_id', params.id)
      .maybeSingle();

    if (!professor) {
      return NextResponse.json(
        { error: 'Professor não encontrado ou não pertence à empresa' },
        { status: 404 }
      );
    }

    // Adicionar como admin
    const { error: insertError } = await supabase
      .from('empresa_admins')
      .insert({
        empresa_id: params.id,
        user_id: professorId,
        is_owner: false,
        permissoes: {},
      });

    if (insertError) {
      throw insertError;
    }

    // Atualizar is_admin na tabela professores
    await supabase
      .from('professores')
      .update({ is_admin: true })
      .eq('id', professorId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar admin';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

