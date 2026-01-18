import { NextRequest, NextResponse } from 'next/server';
import {
  atividadeService,
  AtividadeNotFoundError,
  AtividadeValidationError,
} from '@/backend/services/atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeAtividade = (
  atividade: Awaited<ReturnType<typeof atividadeService.getById>>,
) => {
  const a = atividade as any; // Type assertion para contornar incompatibilidade de tipos
  return {
    id: a.id,
    moduloId: a.moduloId || a.modulo_id,
    tipo: a.tipo,
    titulo: a.titulo,
    arquivoUrl: a.arquivoUrl || a.arquivo_url,
    gabaritoUrl: a.gabaritoUrl || a.gabarito_url,
    linkExterno: a.linkExterno || a.link_externo,
    obrigatorio: a.obrigatorio,
    ordemExibicao: a.ordemExibicao || a.ordem_exibicao,
    createdAt: a.createdAt?.toISOString?.() || a.created_at,
    updatedAt: a.updatedAt?.toISOString?.() || a.updated_at,
  };
};

function handleError(error: unknown) {
  if (error instanceof AtividadeNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof AtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Buscar atividade por ID
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const atividade = await atividadeService.getById(params.id);
    return NextResponse.json({ data: serializeAtividade(atividade) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH - Atualizar atividade (especialmente arquivo_url após upload direto)
async function patchHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const atividade = await atividadeService.update(params.id, {
      arquivoUrl: body?.arquivoUrl,
      gabaritoUrl: body?.gabaritoUrl,
      linkExterno: body?.linkExterno,
      titulo: body?.titulo,
      obrigatorio: body?.obrigatorio,
      ordemExibicao: body?.ordemExibicao,
    });

    return NextResponse.json({ data: serializeAtividade(atividade) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => patchHandler(req, params))(request);
}

async function deleteHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await atividadeService.delete(params.id);
    return NextResponse.json({ message: 'Atividade removida com sucesso' });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}
