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
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// POST - Gerar estrutura de atividades padrão para uma frente
async function postHandler(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const frenteId = body?.frente_id;

    if (!frenteId) {
      return NextResponse.json({ error: 'frente_id is required' }, { status: 400 });
    }

    await atividadeService.gerarAtividadesPadrao(frenteId);

    return NextResponse.json(
      { message: 'Atividades padrão geradas com sucesso' },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);



