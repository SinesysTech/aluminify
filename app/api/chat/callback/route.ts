import { NextRequest, NextResponse } from 'next/server';

// Armazenar respostas temporariamente em memória (por sessionId)
// Em produção, considere usar Redis ou outro sistema de cache
const pendingResponses = new Map<string, {
  chunks: string[];
  isComplete: boolean;
  timestamp: number;
}>();

// Limpar respostas antigas (mais de 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of pendingResponses.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      pendingResponses.delete(sessionId);
    }
  }
}, 60000); // Limpar a cada minuto

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
    
    console.log('[Chat Callback] Recebendo resposta do agente:', {
      sessionId: body.sessionId,
      hasOutput: !!body.output,
      hasChunk: !!body.chunk,
      isComplete: body.isComplete,
    });
    
    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'SessionId é necessário' 
      }, { status: 400 });
    }
    
    // Obter ou criar entrada para esta sessão
    let sessionData = pendingResponses.get(sessionId);
    if (!sessionData) {
      sessionData = {
        chunks: [],
        isComplete: false,
        timestamp: Date.now(),
      };
      pendingResponses.set(sessionId, sessionData);
    }
    
    // Adicionar chunk ou output completo
    if (body.chunk) {
      // Streaming: adicionar chunk
      sessionData.chunks.push(body.chunk);
      console.log('[Chat Callback] Chunk adicionado para sessionId:', sessionId, 'Total chunks:', sessionData.chunks.length);
    } else if (body.output) {
      // Resposta completa: adicionar como único chunk
      sessionData.chunks.push(body.output);
      sessionData.isComplete = true;
      console.log('[Chat Callback] Resposta completa recebida para sessionId:', sessionId);
    }
    
    // Marcar como completo se indicado
    if (body.isComplete !== undefined) {
      sessionData.isComplete = body.isComplete;
    }
    
    // Atualizar timestamp
    sessionData.timestamp = Date.now();
    
    return NextResponse.json({ 
      success: true,
      message: 'Resposta recebida com sucesso',
      chunksReceived: sessionData.chunks.length,
      isComplete: sessionData.isComplete,
    });
  } catch (error) {
    console.error('[Chat Callback] Erro ao processar callback:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar callback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Endpoint para verificar se há resposta disponível para uma sessão
 * Usado pelo cliente para fazer polling
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'SessionId é necessário' 
    }, { status: 400 });
  }
  
  const sessionData = pendingResponses.get(sessionId);
  
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
export function getPendingResponse(sessionId: string): { chunks: string[]; isComplete: boolean } | null {
  const data = pendingResponses.get(sessionId);
  if (!data) return null;
  
  return {
    chunks: [...data.chunks],
    isComplete: data.isComplete,
  };
}

// Exportar função para limpar resposta após uso
export function clearPendingResponse(sessionId: string): void {
  pendingResponses.delete(sessionId);
}

