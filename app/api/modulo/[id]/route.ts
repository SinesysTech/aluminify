import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { getDatabaseClient } from '@/backend/clients/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function patchHandler(request: AuthenticatedRequest, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { importancia } = body;

    if (!importancia || !['Alta', 'Media', 'Baixa', 'Base'].includes(importancia)) {
      return NextResponse.json(
        { error: 'Importância inválida. Use: Alta, Media, Baixa ou Base' },
        { status: 400 }
      );
    }

    const client = getDatabaseClient();

    // Verificar se o usuário é professor
    const { data: professorData } = await client
      .from('professores')
      .select('id')
      .eq('id', request.user!.id)
      .maybeSingle();

    if (!professorData) {
      return NextResponse.json({ error: 'Acesso negado. Apenas professores podem editar módulos.' }, { status: 403 });
    }

    // Verificar se o módulo existe (RLS já valida permissões)
    const { data: modulo, error: moduloError } = await client
      .from('modulos')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (moduloError) {
      throw new Error(`Erro ao buscar módulo: ${moduloError.message}`);
    }

    if (!modulo) {
      return NextResponse.json({ error: 'Módulo não encontrado ou você não tem permissão para editá-lo' }, { status: 404 });
    }

    // Atualizar a importância
    const { data: updatedModulo, error: updateError } = await client
      .from('modulos')
      .update({ importancia })
      .eq('id', id)
      .select('id, importancia')
      .single();

    if (updateError) {
      throw new Error(`Erro ao atualizar módulo: ${updateError.message}`);
    }

    return NextResponse.json({ data: updatedModulo });
  } catch (error) {
    console.error('[modulo PATCH]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => patchHandler(req, params))(request);
}
















