import { NextRequest, NextResponse } from 'next/server';
import { responseStore } from '@/backend/services/cache';

/**
 * Endpoint de callback para receber respostas do agente via n8n
 * 
 * Este endpoint será chamado pelo n8n quando o agente tiver uma resposta pronta.
 * 
 * Formato esperado do body:
 * {
 *   "sessionId": "string",
 *   "output": "string" ou "chunk": "string" (para streaming)
 *   "isComplete": boolean (opcional, indica se é o último chunk)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Chat Callback] ========== CALLBACK RECEBIDO ==========');
    console.log('[Chat Callback] Dados recebidos:', {
      sessionId: body.sessionId,
      hasOutput: !!body.output,
      hasChunk: !!body.chunk,
      isComplete: body.isComplete,
      outputLength: body.output?.length,
      chunkLength: body.chunk?.length,
    });

    const sessionId = body.sessionId;
    if (!sessionId) {
      console.error('[Chat Callback] ❌ SessionId não fornecido no callback');
      return NextResponse.json({
        error: 'SessionId é necessário'
      }, { status: 400 });
    }

    // Adicionar chunk ou output completo usando responseStore
    if (body.chunk) {
      // Streaming: adicionar chunk
      await responseStore.addChunk(sessionId, body.chunk, body.isComplete || false);
      const current = await responseStore.get(sessionId);
      console.log('[Chat Callback] ✅ Chunk adicionado para sessionId:', sessionId, 'Total chunks:', current?.chunks.length || 0);
    } else if (body.output) {
      // Resposta completa: adicionar como único chunk
      await responseStore.addChunk(sessionId, body.output, true);
      console.log('[Chat Callback] ✅ Resposta completa recebida para sessionId:', sessionId);
    } else {
      console.warn('[Chat Callback] ⚠️  Nem chunk nem output fornecido no callback');
      return NextResponse.json({
        error: 'Nem chunk nem output fornecido'
      }, { status: 400 });
    }

    // Marcar como completo se indicado
    if (body.isComplete === true) {
      await responseStore.markComplete(sessionId);
      console.log('[Chat Callback] ✅ Resposta marcada como completa para sessionId:', sessionId);
    }

    const currentData = await responseStore.get(sessionId);

    console.log('[Chat Callback] Estado atual:', {
      sessionId,
      chunksReceived: currentData?.chunks.length || 0,
      isComplete: currentData?.isComplete || false,
    });
    console.log('[Chat Callback] ==========================================');

    return NextResponse.json({
      success: true,
      message: 'Resposta recebida com sucesso',
      chunksReceived: currentData?.chunks.length || 0,
      isComplete: currentData?.isComplete || false,
    });
  } catch (error) {
    console.error('[Chat Callback] ❌ Erro ao processar callback:', error);
    return NextResponse.json({
      error: 'Erro ao processar callback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Endpoint para verificar se há resposta disponível para uma sessão
 * Usado pelo cliente para fazer polling (opcional)
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({
      error: 'SessionId é necessário'
    }, { status: 400 });
  }

  const sessionData = await responseStore.get(sessionId);

  if (!sessionData) {
    return NextResponse.json({
      available: false,
      message: 'Nenhuma resposta disponível ainda',
    });
  }

  return NextResponse.json({
    available: true,
    chunks: sessionData.chunks,
    isComplete: sessionData.isComplete,
    totalChunks: sessionData.chunks.length,
  });
}

// Exportar função para acessar respostas pendentes (usado pelo endpoint de streaming)
export async function getPendingResponse(sessionId: string): Promise<{ chunks: string[]; isComplete: boolean } | null> {
  const data = await responseStore.get(sessionId);
  if (!data) return null;

  return {
    chunks: [...data.chunks],
    isComplete: data.isComplete,
  };
}

// Exportar função para limpar resposta após uso
export async function clearPendingResponse(sessionId: string): Promise<void> {
  await responseStore.delete(sessionId);
}

