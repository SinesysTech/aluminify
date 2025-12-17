import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { flashcardsService } from '@/backend/services/flashcards/flashcards.service';

async function handler(request: AuthenticatedRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Método não suportado' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const cardId = body?.cardId as string;
    const feedback = Number(body?.feedback);

    if (!cardId) {
      return NextResponse.json({ error: 'cardId é obrigatório' }, { status: 400 });
    }

    const data = await flashcardsService.sendFeedback(request.user!.id, cardId, feedback);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[flashcards/feedback]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = requireUserAuth(handler);

















