import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { flashcardsService, FlashcardImportRow } from '@/backend/services/flashcards/flashcards.service';

async function handler(request: AuthenticatedRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Método não suportado' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const rows = (body?.rows ?? []) as FlashcardImportRow[];

    const result = await flashcardsService.importFlashcards(rows, request.user!.id);

    const hasErrors = result.errors.length > 0;
    return NextResponse.json(
      {
        data: {
          total: result.total,
          inserted: result.inserted,
          errors: result.errors,
        },
      },
      { status: hasErrors ? 207 : 200 }, // 207 Multi-Status indica parcial
    );
  } catch (error) {
    console.error('[flashcards/import]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = requireUserAuth(handler);











