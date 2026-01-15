import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { createFlashcardsService, type FlashcardsReviewScope } from '@/backend/services/flashcards/flashcards.service';

async function handler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') ?? 'revisao_geral';
    const cursoId = searchParams.get('cursoId') || undefined;
    const frenteId = searchParams.get('frenteId') || undefined;
    const moduloId = searchParams.get('moduloId') || undefined;
    const scopeParam = searchParams.get('scope') || undefined;
    const scope: FlashcardsReviewScope = scopeParam === 'completed' ? 'completed' : 'all';
    
    // Parâmetro para excluir cards já vistos na sessão
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : undefined;

    console.log(`[flashcards/revisao] Requisição recebida - modo: ${modo}, alunoId: ${request.user!.id}`);
    const flashcardsService = createFlashcardsService();
    const data = await flashcardsService.listForReview(
      request.user!.id,
      modo,
      { cursoId, frenteId, moduloId },
      excludeIds,
      scope,
    );
    console.log(`[flashcards/revisao] Retornando ${data.length} flashcards`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[flashcards/revisao] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireUserAuth(handler);


