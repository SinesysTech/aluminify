import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/superadmin/empresas/[id] - Get empresa details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const adminClient = getDatabaseClient();

    const { data: empresa, error } = await adminClient
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: empresa });
  } catch (error) {
    console.error('Error in GET /api/superadmin/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/superadmin/empresas/[id] - Update empresa
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const adminClient = getDatabaseClient();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj || null;
    if (body.emailContato !== undefined) updateData.email_contato = body.emailContato || null;
    if (body.telefone !== undefined) updateData.telefone = body.telefone || null;
    if (body.plano !== undefined) updateData.plano = body.plano;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;

    const { data: empresa, error } = await adminClient
      .from('empresas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating empresa:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: empresa });
  } catch (error) {
    console.error('Error in PATCH /api/superadmin/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/empresas/[id]/activate - Activate empresa
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as 'activate' | 'deactivate';

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }

    const adminClient = getDatabaseClient();

    const { data: empresa, error } = await adminClient
      .from('empresas')
      .update({ ativo: action === 'activate' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating empresa status:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: empresa,
      message: action === 'activate' ? 'Empresa ativada com sucesso' : 'Empresa desativada com sucesso',
    });
  } catch (error) {
    console.error('Error in POST /api/superadmin/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
