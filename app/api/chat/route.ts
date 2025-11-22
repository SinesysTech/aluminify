import { NextResponse } from 'next/server';
import {
  chatService,
  ChatValidationError,
  ChatServiceError,
} from '@/backend/services/chat';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

function handleError(error: unknown) {
  if (error instanceof ChatValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ChatServiceError) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Log detalhado do erro
  console.error('[Chat API] Error:', error);

  // Extrair mensagem de erro mais detalhada
  let errorMessage = 'Internal server error';
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error('[Chat API] Error stack:', error.stack);
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  return NextResponse.json({
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
  }, { status: 500 });
}

/**
 * POST - Enviar mensagem para o chat (sem streaming)
 *
 * Body esperado:
 * {
 *   "message": "texto da mensagem",
 *   "sessionId": "session-id",
 *   "userId": "user-id"
 * }
 *
 * Resposta:
 * {
 *   "data": {
 *     "output": "resposta do agente"
 *   }
 * }
 */
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();

    console.log('[Chat API] ========== POST REQUEST ==========');
    console.log('[Chat API] Message:', body.message?.substring(0, 100));
    console.log('[Chat API] SessionId:', body.sessionId);
    console.log('[Chat API] UserId:', body.userId);

    if (!body?.message) {
      return NextResponse.json({
        error: 'Campo obrigatório: message é necessário'
      }, { status: 400 });
    }

    // Usar userId do usuário autenticado ou do body
    const userId = body.userId || request.user?.id;
    if (!userId) {
      return NextResponse.json({
        error: 'User ID é necessário (fornecido no body ou via autenticação)'
      }, { status: 400 });
    }

    // Usar sessionId do body
    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID é necessário'
      }, { status: 400 });
    }

    console.log('[Chat API] ➡️  Enviando para N8N webhook...');

    // Enviar para o N8N e aguardar resposta
    const response = await chatService.sendMessage({
      message: body.message,
      sessionId: sessionId,
      userId: userId,
    });

    console.log('[Chat API] ✅ Resposta recebida do N8N');
    console.log('[Chat API] Output length:', response.output?.length || 0);
    console.log('[Chat API] Output preview:', response.output?.substring(0, 100));
    console.log('[Chat API] ==========================================');

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

// POST simples - apenas envia para N8N e retorna a resposta
export const POST = requireAuth(postHandler);
