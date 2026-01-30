import { NextResponse } from 'next/server';
import {
  chatService,
  ChatValidationError,
  ChatServiceError,
} from '@/app/tobias/services/chat';
import { conversationService } from '@/app/tobias/services/conversation';
import type { ChatMessage } from '@/app/tobias/services/conversation';
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';
import { saveChatAttachments, cleanupChatAttachments } from '@/app/tobias/services/chat/attachments.service';
import type { ChatAttachment } from '@/app/tobias/services/chat/chat.types';

export const runtime = 'nodejs';

/**
 * Obtém a URL base acessível para o n8n baixar os anexos.
 * Prioriza variável de ambiente, depois headers da requisição.
 */
function getPublicBaseUrl(request: AuthenticatedRequest): string {
  // 1. Verificar variável de ambiente (mais confiável)
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }

  // 2. Tentar usar headers da requisição (x-forwarded-host, host)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host');
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  if (host) {
    // Se for localhost, tentar usar http (desenvolvimento)
    const protocol = host.includes('localhost') ? 'http' : forwardedProto;
    return `${protocol}://${host}`;
  }

  // 3. Fallback: usar a URL da requisição
  const baseUrl = new URL(request.url);
  return `${baseUrl.protocol}//${baseUrl.host}`;
}

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
  let newConversation = false;

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
      const formNew = formData.get('newConversation');
      if (typeof formNew === 'string') {
        const v = formNew.toLowerCase();
        newConversation = v === 'true' || v === '1' || v === 'yes';
      }

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
      const v = String(body?.newConversation ?? '').toLowerCase();
      newConversation = v === 'true' || v === '1' || v === 'yes';
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
    const conversation = newConversation
      ? await conversationService.createConversation({ userId })
      : await conversationService.getOrCreateActiveConversation(userId);

    console.log('[Chat API] Conversation ID:', conversation.id);
    console.log('[Chat API] SessionId:', conversation.session_id);
    console.log('[Chat API] Is new conversation:', newConversation);
    console.log('[Chat API] ➡️  Enviando para N8N webhook...');

    if (uploadedFiles.length > 0) {
      attachments = await saveChatAttachments(uploadedFiles);
      const publicBaseUrl = getPublicBaseUrl(request);

      attachments = attachments.map((attachment) => {
        // Garantir que o nome do arquivo sempre tenha extensão
        let fileName = attachment.name;
        if (!fileName.includes('.')) {
          // Se não tiver extensão, adicionar baseado no mimeType
          const extMap: Record<string, string> = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/webp': '.webp',
            'image/gif': '.gif',
            'application/pdf': '.pdf',
          };
          const ext = extMap[attachment.mimeType] || '';
          fileName = `${fileName}${ext}`;
        }
        
        // Incluir nome do arquivo com extensão na URL para o analyzer do N8N conseguir identificar o formato
        const encodedFileName = encodeURIComponent(fileName);
        const downloadUrl = `${publicBaseUrl}/api/tobias/chat/attachments/${attachment.id}/${encodedFileName}?token=${attachment.token}`;
        
        console.log('[Chat API] URL base pública:', publicBaseUrl);
        console.log('[Chat API] URL do anexo gerada:', downloadUrl);
        console.log('[Chat API] Nome do arquivo:', fileName);
        console.log('[Chat API] Tipo MIME:', attachment.mimeType);
        
        return {
          ...attachment,
          name: fileName, // Atualizar nome se foi adicionada extensão
          downloadUrl,
        };
      });

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
        ? `${message}\n\n[ANEXO:${attachments.map((attachment) => attachment.name).join(',')}]`
        : message,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: response.output || '',
      timestamp: Date.now(),
    };

    // Para novas conversas, não usar histórico existente (já que é uma conversa nova)
    const existingHistory = newConversation
      ? []
      : normalizeHistory(
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
