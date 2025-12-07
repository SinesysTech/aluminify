import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { flashcardsService, ListFlashcardsFilters } from '@/backend/services/flashcards/flashcards.service';

async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: ListFlashcardsFilters = {
      disciplinaId: searchParams.get('disciplinaId') || undefined,
      frenteId: searchParams.get('frenteId') || undefined,
      moduloId: searchParams.get('moduloId') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      orderBy: (searchParams.get('orderBy') as 'created_at' | 'pergunta') || undefined,
      orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || undefined,
    };

    const result = await flashcardsService.listAll(filters, request.user!.id);
    return NextResponse.json({ data: result.data, total: result.total });
  } catch (error) {
    console.error('[flashcards GET]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { moduloId, pergunta, resposta } = body;

    if (!moduloId || !pergunta || !resposta) {
      return NextResponse.json(
        { error: 'Módulo, pergunta e resposta são obrigatórios.' },
        { status: 400 },
      );
    }

    const flashcard = await flashcardsService.create(
      { moduloId, pergunta, resposta },
      request.user!.id,
    );

    return NextResponse.json({ data: flashcard }, { status: 201 });
  } catch (error) {
    console.error('[flashcards POST]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireUserAuth(getHandler);
export const POST = requireUserAuth(postHandler);


