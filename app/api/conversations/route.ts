import { NextResponse } from 'next/server';
import { conversationService } from '@/backend/services/conversation';
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';
import { cacheService } from '@/backend/services/cache';

/**
 * GET /api/conversations
 * Listar todas as conversas do usuário
 * Query params: ?active=true para retornar apenas a conversa ativa
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se está pedindo apenas a conversa ativa
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    if (activeOnly) {
      const activeConversation = await conversationService.getActiveConversation({ userId });
      if (!activeConversation) {
        return NextResponse.json({ conversations: [] });
      }

      const history = await conversationService.getConversationHistory(activeConversation.id, userId);
      return NextResponse.json({
        conversations: [{ ...activeConversation, history }],
      });
    }

    // Cachear lista de conversas (metadados apenas, sem histórico)
    const cacheKey = `cache:user:${userId}:conversas`;
    const conversations = await cacheService.getOrSet(
      cacheKey,
      () => conversationService.listConversations({ userId }),
      300 // TTL: 5 minutos
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[Conversations API] Error listing conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Criar nova conversa
 *
 * Body: { title?: string }
 */
async function postHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const conversation = await conversationService.createConversation({
      userId,
      title: body.title,
    });

    // Invalidar cache de conversas
    await cacheService.del(`cache:user:${userId}:conversas`);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('[Conversations API] Error creating conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
