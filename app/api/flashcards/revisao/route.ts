import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { flashcardsService } from '@/backend/services/flashcards/flashcards.service';

async function handler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') ?? 'revisao_geral';
    const cursoId = searchParams.get('cursoId') || undefined;
    const frenteId = searchParams.get('frenteId') || undefined;
    const moduloId = searchParams.get('moduloId') || undefined;
    
    // Parâmetro para excluir cards já vistos na sessão
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : undefined;

    const data = await flashcardsService.listForReview(
      request.user!.id,
      modo,
      { cursoId, frenteId, moduloId },
      excludeIds
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[flashcards/revisao]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireUserAuth(handler);


