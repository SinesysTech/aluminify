import { NextRequest, NextResponse } from 'next/server';
import {
  atividadeService,
  AtividadeValidationError,
} from '@/backend/services/atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

function handleError(error: unknown) {
  if (error instanceof AtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// POST - Gerar estrutura de atividades personalizadas para uma frente baseado nas regras do curso
async function postHandler(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const cursoId = body?.curso_id;
    const frenteId = body?.frente_id;

    if (!cursoId) {
      return NextResponse.json({ error: 'curso_id is required' }, { status: 400 });
    }

    if (!frenteId) {
      return NextResponse.json({ error: 'frente_id is required' }, { status: 400 });
    }

    await atividadeService.gerarAtividadesPersonalizadas(cursoId, frenteId);

    return NextResponse.json(
      { message: 'Atividades personalizadas geradas com sucesso' },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);



