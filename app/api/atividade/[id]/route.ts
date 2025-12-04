import { NextRequest, NextResponse } from 'next/server';
import {
  atividadeService,
  AtividadeNotFoundError,
  AtividadeValidationError,
} from '@/backend/services/atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeAtividade = (
  atividade: Awaited<ReturnType<typeof atividadeService.getById>>,
) => ({
  id: atividade.id,
  moduloId: atividade.moduloId,
  tipo: atividade.tipo,
  titulo: atividade.titulo,
  arquivoUrl: atividade.arquivoUrl,
  gabaritoUrl: atividade.gabaritoUrl,
  linkExterno: atividade.linkExterno,
  obrigatorio: atividade.obrigatorio,
  ordemExibicao: atividade.ordemExibicao,
  createdAt: atividade.createdAt.toISOString(),
  updatedAt: atividade.updatedAt.toISOString(),
});

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

