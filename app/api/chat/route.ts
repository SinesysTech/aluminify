import { NextResponse } from 'next/server';
import {
  chatService,
  ChatValidationError,
  ChatServiceError,
} from '@/backend/services/chat';
import { conversationService } from '@/backend/services/conversation';
import type { ChatMessage } from '@/backend/services/conversation';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { saveChatAttachments, cleanupChatAttachments } from '@/backend/services/chat/attachments.service';
import type { ChatAttachment } from '@/backend/services/chat/chat.types';

export const runtime = 'nodejs';

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    (record.role === 'user' || record.role === 'assistant') &&
    typeof record.content === 'string' &&
    typeof record.timestamp === 'number'
  );
}

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter(isChatMessage);
}

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
  let attachments: ChatAttachment[] = [];

  try {
    const contentType = request.headers.get('content-type') || '';
    let message: string | null = null;
    let rawUserId: string | null = null;
    const uploadedFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const formMessage = formData.get('message');
      message = typeof formMessage === 'string' ? formMessage : null;
      const formUserId = formData.get('userId');
      rawUserId = typeof formUserId === 'string' ? formUserId : null;

      const attachmentFields = ['attachments', 'files'];
      for (const field of attachmentFields) {
        const values = formData.getAll(field);
        for (const value of values) {
          if (value instanceof File && value.size > 0) {
            uploadedFiles.push(value);
          }
        }
      }
    } else {
      const body = await request.json();
      message = body?.message ?? null;
      rawUserId = body?.userId ?? null;
    }

    console.log('[Chat API] ========== POST REQUEST ==========');
    console.log('[Chat API] Message:', message?.substring(0, 100));

    if (!message) {
      return NextResponse.json({
        error: 'Campo obrigatório: message é necessário'
      }, { status: 400 });
    }

    // Usar userId do usuário autenticado ou do payload
    const userId = rawUserId || request.user?.id;
    if (!userId) {
      return NextResponse.json({
        error: 'User ID é necessário (fornecido no body ou via autenticação)'
      }, { status: 400 });
    }

    console.log('[Chat API] UserId:', userId);

    // Obter ou criar conversa ativa para o usuário
    const conversation = await conversationService.getOrCreateActiveConversation(userId);

    console.log('[Chat API] Conversation ID:', conversation.id);
    console.log('[Chat API] SessionId:', conversation.session_id);
    console.log('[Chat API] ➡️  Enviando para N8N webhook...');

    if (uploadedFiles.length > 0) {
      attachments = await saveChatAttachments(uploadedFiles);
      const baseUrl = new URL(request.url);

      attachments = attachments.map((attachment) => ({
        ...attachment,
        downloadUrl: `${baseUrl.protocol}//${baseUrl.host}/api/chat/attachments/${attachment.id}?token=${attachment.token}`,
      }));

      console.log('[Chat API] Attachments salvos:', attachments.map((file) => file.name));
    }

    // Enviar para o N8N e aguardar resposta
    const response = await chatService.sendMessage({
      message,
      sessionId: conversation.session_id,
      userId: userId,
      attachments,
    });

    console.log('[Chat API] ✅ Resposta recebida do N8N');
    console.log('[Chat API] Output length:', response.output?.length || 0);
    console.log('[Chat API] Output preview:', response.output?.substring(0, 100));

    // Salvar mensagens no histórico da conversa
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: attachments.length
        ? `${message}\n\n[Anexo enviado: ${attachments.map((attachment) => `${attachment.name} (${attachment.downloadUrl})`).join(', ')}]`
        : message,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: response.output || '',
      timestamp: Date.now(),
    };

    const existingHistory = normalizeHistory(
      await conversationService.getConversationHistory(conversation.id, userId)
    );
    const historyFromAgent = normalizeHistory(response.history);
    const historyToSave =
      historyFromAgent.length > 0
        ? historyFromAgent
        : [...existingHistory, userMessage, assistantMessage];

    await conversationService.updateConversationHistory(conversation.id, userId, historyToSave);

    console.log('[Chat API] ✅ Messages saved to conversation history');
    console.log('[Chat API] ==========================================');

    return NextResponse.json({
      data: response,
      conversationId: conversation.id,
      history: historyToSave,
    });
  } catch (error) {
    if (attachments.length > 0) {
      await cleanupChatAttachments(attachments);
    }
    return handleError(error);
  }
}

// POST simples - apenas envia para N8N e retorna a resposta
export const POST = requireAuth(postHandler);
