import { NextRequest, NextResponse } from 'next/server';
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
  console.error('Chat API Error:', error);
  
  // Extrair mensagem de erro mais detalhada
  let errorMessage = 'Internal server error';
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error('Error stack:', error.stack);
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

// POST - Enviar mensagem para o chat
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
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

    // Usar sessionId do body ou gerar um novo
    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID é necessário' 
      }, { status: 400 });
    }
    
    const response = await chatService.sendMessage({
      message: body.message,
      sessionId: sessionId,
      userId: userId,
    });
    
    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

// POST com streaming - Enviar mensagem e receber resposta via streaming (formato AI SDK)
async function postStreamHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Log para debug - mostrar estrutura completa
    console.log('[Chat API] ========== REQUEST DEBUG ==========');
    console.log('[Chat API] Full request body keys:', Object.keys(body));
    console.log('[Chat API] Request body:', JSON.stringify(body, null, 2));
    console.log('[Chat API] Body type:', typeof body);
    console.log('[Chat API] Has messages?', 'messages' in body);
    console.log('[Chat API] Messages type:', Array.isArray(body.messages) ? 'array' : typeof body.messages);
    
    // O AI SDK envia messages array, pegar a última mensagem do usuário
    const messages = body.messages || [];
    console.log('[Chat API] Messages array length:', messages.length);
    console.log('[Chat API] Messages:', JSON.stringify(messages, null, 2));
    
    // Se não houver messages, tentar pegar do body diretamente
    if (!messages || messages.length === 0) {
      console.error('[Chat API] No messages array found. Body structure:', {
        keys: Object.keys(body),
        body: body,
      });
    }
    
    const lastMessage = messages[messages.length - 1];
    
    console.log('[Chat API] Last message exists?', !!lastMessage);
    if (lastMessage) {
      console.log('[Chat API] Last message keys:', Object.keys(lastMessage));
      console.log('[Chat API] Last message:', JSON.stringify(lastMessage, null, 2));
    }
    
    if (!lastMessage) {
      console.error('[Chat API] No last message found');
      return NextResponse.json({ 
        error: 'Campo obrigatório: message é necessário',
        debug: process.env.NODE_ENV === 'development' ? {
          bodyKeys: Object.keys(body),
          hasMessages: 'messages' in body,
          messagesLength: messages.length,
          bodySample: JSON.stringify(body).substring(0, 500),
        } : undefined,
      }, { status: 400 });
    }

    // Na versão 5.x do AI SDK, mensagens usam 'parts' em vez de 'content'
    // Extrair texto das parts
    let messageText = '';
    
    // Tentar extrair de 'parts' (formato v5.x)
    if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      // Filtrar apenas partes de texto e extrair o texto
      const textParts = lastMessage.parts.filter((part: any) => part.type === 'text');
      messageText = textParts.map((part: any) => part.text || '').join('');
      console.log('[Chat API] Extracted text from parts:', messageText);
    } 
    // Tentar extrair de 'content' (pode ser string ou array)
    else if (lastMessage.content) {
      if (typeof lastMessage.content === 'string') {
        messageText = lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Se content for array, pode ser array de strings ou objetos
        messageText = lastMessage.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            if (item?.type === 'text' && item?.text) return item.text;
            return '';
          })
          .join('');
      }
      console.log('[Chat API] Extracted text from content:', messageText);
    } 
    // Tentar extrair de 'text' diretamente
    else if (typeof lastMessage.text === 'string') {
      messageText = lastMessage.text;
      console.log('[Chat API] Extracted text from text field:', messageText);
    }
    // Tentar extrair de qualquer campo que possa conter texto
    else {
      // Verificar se há algum campo que possa ser o texto
      const possibleTextFields = ['message', 'input', 'prompt', 'query'];
      for (const field of possibleTextFields) {
        if (lastMessage[field] && typeof lastMessage[field] === 'string') {
          messageText = lastMessage[field];
          console.log(`[Chat API] Extracted text from ${field}:`, messageText);
          break;
        }
      }
      
      if (!messageText) {
        console.error('[Chat API] No text found in message. Message structure:', {
          keys: Object.keys(lastMessage),
          message: lastMessage,
        });
      }
    }
    
    if (!messageText || messageText.trim().length === 0) {
      console.error('[Chat API] Empty message text after extraction');
      return NextResponse.json({ 
        error: 'Campo obrigatório: message é necessário (nenhum texto encontrado na mensagem)',
        debug: process.env.NODE_ENV === 'development' ? {
          lastMessage,
          messageKeys: Object.keys(lastMessage || {}),
        } : undefined,
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
    console.log('[Chat API] SessionId from body:', sessionId);
    console.log('[Chat API] SessionId type:', typeof sessionId);
    console.log('[Chat API] SessionId truthy?', !!sessionId);
    console.log('[Chat API] SessionId trimmed:', sessionId?.trim());
    
    if (!sessionId || (typeof sessionId === 'string' && sessionId.trim().length === 0)) {
      console.error('[Chat API] SessionId validation failed:', {
        sessionId,
        type: typeof sessionId,
        bodyKeys: Object.keys(body),
        bodySample: JSON.stringify(body).substring(0, 500),
      });
      return NextResponse.json({ 
        error: 'Session ID é necessário',
        debug: process.env.NODE_ENV === 'development' ? {
          receivedSessionId: sessionId,
          bodyKeys: Object.keys(body),
        } : undefined,
      }, { status: 400 });
    }

    // Importar funções do callback
    const { getPendingResponse, clearPendingResponse } = await import('./callback/route');
    
    // Gerar um ID único para a mensagem de resposta
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar um ReadableStream para streaming no formato AI SDK v5.x (UIMessageChunk)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let processedChunks = 0;
        const maxWaitTime = 5 * 60 * 1000; // 5 minutos máximo de espera
        const startTime = Date.now();
        const pollInterval = 200; // Verificar a cada 200ms para resposta mais rápida
        let responseStarted = false;
        
        try {
          // Enviar evento de início imediatamente
          // O AI SDK espera o formato: 0:{"type":"text-start","id":"..."}\n
          const startChunk = {
            type: 'text-start',
            id: messageId,
          };
          // Formato correto para AI SDK v5: cada linha deve começar com "0:" seguido do JSON
          // O formato é: "0:" + JSON + "\n" (uma quebra de linha apenas)
          const startData = '0:' + JSON.stringify(startChunk) + '\n';
          controller.enqueue(encoder.encode(startData));
          console.log('[Chat API] Stream iniciado, enviando text-start');
          console.log('[Chat API] text-start data:', startData);
          
          // Enviar a mensagem para o webhook e verificar se há resposta imediata
          console.log('[Chat API] Enviando mensagem para webhook...');
          let immediateResponse = null;
          try {
            const webhookResponse = await chatService.sendMessage({
              message: messageText,
              sessionId: sessionId,
              userId: userId,
            });
            
            // Se o webhook retornou uma resposta imediata (não vazia), usar ela
            if (webhookResponse && webhookResponse.output && 
                webhookResponse.output.trim() && 
                webhookResponse.output !== 'Aguarde, processando sua mensagem...') {
              immediateResponse = webhookResponse.output;
              console.log('[Chat API] Webhook retornou resposta imediata');
              console.log('[Chat API] Resposta length:', immediateResponse.length);
              console.log('[Chat API] Resposta preview:', immediateResponse.substring(0, 100));
              
              // Enviar resposta imediata em chunks menores para melhor streaming
              // Dividir a resposta em pedaços para simular streaming
              const chunkSize = 50; // Enviar 50 caracteres por vez
              const chunks = [];
              for (let i = 0; i < immediateResponse.length; i += chunkSize) {
                chunks.push(immediateResponse.substring(i, i + chunkSize));
              }
              
              console.log('[Chat API] Dividindo resposta em', chunks.length, 'chunks');
              
              // Enviar cada chunk como text-delta
              // O AI SDK espera o formato: 0:{"type":"text-delta","id":"...","delta":"..."}\n
              for (let i = 0; i < chunks.length; i++) {
                const deltaChunk = {
                  type: 'text-delta',
                  id: messageId,
                  delta: chunks[i],
                };
                // Formato correto: "0:" + JSON + "\n" (uma quebra de linha)
                const deltaData = '0:' + JSON.stringify(deltaChunk) + '\n';
                console.log('[Chat API] Enviando chunk', i + 1, 'de', chunks.length, '(length:', chunks[i].length, ')');
                controller.enqueue(encoder.encode(deltaData));
                
                // Pequeno delay entre chunks para simular streaming real
                if (i < chunks.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
              }
              
              responseStarted = true;
              
              // Finalizar stream
              const endChunk = {
                type: 'text-end',
                id: messageId,
              };
              const endData = '0:' + JSON.stringify(endChunk) + '\n';
              console.log('[Chat API] Enviando text-end e fechando stream');
              controller.enqueue(encoder.encode(endData));
              controller.close();
              console.log('[Chat API] Stream fechado com sucesso');
              return; // Sair da função, não precisa aguardar callback
            } else {
              console.log('[Chat API] Webhook não retornou resposta imediata ou resposta vazia');
              console.log('[Chat API] webhookResponse:', JSON.stringify(webhookResponse).substring(0, 200));
              console.log('[Chat API] Aguardando resposta via callback...');
            }
          } catch (error) {
            console.error('[Chat API] Erro ao enviar mensagem para webhook:', error);
            // Continuar para aguardar callback mesmo com erro
          }
          
          // Aguardar resposta do callback (polling com conexão mantida aberta)
          while (Date.now() - startTime < maxWaitTime) {
            const response = getPendingResponse(sessionId);
            
            if (response && response.chunks.length > processedChunks) {
              // Há novos chunks disponíveis
              const newChunks = response.chunks.slice(processedChunks);
              
              for (const chunk of newChunks) {
                if (!responseStarted) {
                  responseStarted = true;
                  console.log('[Chat API] Primeira resposta recebida do callback');
                }
                
                const deltaChunk = {
                  type: 'text-delta',
                  id: messageId,
                  delta: chunk,
                };
                const deltaData = '0:' + JSON.stringify(deltaChunk) + '\n';
                console.log('[Chat API] Sending text-delta chunk (length:', chunk.length, ')');
                controller.enqueue(encoder.encode(deltaData));
              }
              
              processedChunks = response.chunks.length;
              
              // Se a resposta estiver completa, finalizar
              if (response.isComplete) {
                console.log('[Chat API] Resposta completa recebida, finalizando stream');
                break;
              }
            }
            
            // Aguardar antes de verificar novamente (mantém a conexão aberta)
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
          
          // Verificar se recebemos alguma resposta
          if (!responseStarted) {
            console.warn('[Chat API] Timeout: nenhuma resposta recebida do webhook após 5 minutos');
            // Enviar mensagem de timeout
            const timeoutChunk = {
              type: 'text-delta',
              id: messageId,
              delta: '\n\n[Timeout: O agente não respondeu a tempo. Por favor, tente novamente.]',
            };
            const timeoutData = '0:' + JSON.stringify(timeoutChunk) + '\n';
            controller.enqueue(encoder.encode(timeoutData));
          }
          
          // Limpar resposta após uso (mas manter a conexão para próximas mensagens)
          // Não limpar imediatamente para permitir reconexão
          setTimeout(() => {
            clearPendingResponse(sessionId);
          }, 10000); // Limpar após 10 segundos
          
          // Enviar evento de finalização
          const endChunk = {
            type: 'text-end',
            id: messageId,
          };
              const endData = '0:' + JSON.stringify(endChunk) + '\n';
          console.log('[Chat API] Sending text-end, fechando stream');
          controller.enqueue(encoder.encode(endData));
          controller.close();
          console.log('[Chat API] Stream closed successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Chat API] Erro no stream:', errorMessage);
          // Enviar erro no formato UIMessageChunk
          const errorChunk = {
            type: 'error',
            error: errorMessage,
          };
          const errorData = '0:' + JSON.stringify(errorChunk) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Desabilitar buffering do nginx
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  // Verificar se é uma requisição de streaming
  const acceptHeader = request.headers.get('accept');
  const isStreaming = acceptHeader?.includes('text/event-stream') || 
                      request.nextUrl.searchParams.get('stream') === 'true';

  if (isStreaming) {
    return postStreamHandler(request);
  }

  return postHandler(request);
});

