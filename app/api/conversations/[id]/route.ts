import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/backend/services/conversation';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]
 * Obter conversa por ID
 */
async function getHandler(
  request: AuthenticatedRequest,
  params: { id: string }
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await conversationService.getConversationById(params.id, userId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const history = await conversationService.getConversationHistory(params.id, userId);

    return NextResponse.json({ data: { ...conversation, history } });
  } catch (error) {
    console.error('[Conversations API] Error getting conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/conversations/[id]
 * Atualizar conversa
 *
 * Body: { title?: string, is_active?: boolean }
 */
async function putHandler(
  request: AuthenticatedRequest,
  params: { id: string }
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Conversations API] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    console.log('[Conversations API] Updating conversation:', params.id, 'with body:', body);

    const conversation = await conversationService.updateConversation({
      id: params.id,
      userId,
      title: body.title,
      is_active: body.is_active,
    });

    const history = await conversationService.getConversationHistory(params.id, userId);

    return NextResponse.json({ data: { ...conversation, history } });
  } catch (error) {
    console.error('[Conversations API] Error updating conversation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error('[Conversations API] Error stack:', errorStack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Deletar conversa
 */
async function deleteHandler(
  request: AuthenticatedRequest,
  params: { id: string }
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await conversationService.deleteConversation({ id: params.id, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Conversations API] Error deleting conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => getHandler(req, params))(request);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => putHandler(req, params))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}
