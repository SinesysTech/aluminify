import { NextRequest, NextResponse } from 'next/server';
import {
  atividadeService,
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
  if (error instanceof AtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// GET - Listar atividades (filtro por modulo_id ou frente_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduloId = searchParams.get('modulo_id');
    const frenteId = searchParams.get('frente_id');

    let atividades;

    if (moduloId) {
      atividades = await atividadeService.listByModulo(moduloId);
    } else if (frenteId) {
      atividades = await atividadeService.listByFrente(frenteId);
    } else {
      return NextResponse.json(
        { error: 'modulo_id or frente_id query parameter is required' },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: atividades.map(serializeAtividade) });
  } catch (error) {
    return handleError(error);
  }
}

async function postHandler(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const atividade = await atividadeService.create({
      moduloId: body?.modulo_id,
      tipo: body?.tipo,
      titulo: body?.titulo,
      arquivoUrl: body?.arquivo_url,
      gabaritoUrl: body?.gabarito_url,
      linkExterno: body?.link_externo,
      obrigatorio: body?.obrigatorio,
      ordemExibicao: body?.ordem_exibicao,
    });

    return NextResponse.json({ data: serializeAtividade(atividade) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);