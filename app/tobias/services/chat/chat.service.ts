import { ChatResponse, ChatRequest, ChatIds, ChatAttachment } from './chat.types';
import { ChatValidationError, ChatServiceError } from './errors';

const WEBHOOK_URL = 'https://webhook.sinesys.app/webhook/9e35cb81-5314-4f09-bbde-0d587a8eb6db';
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 5000;

export class ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const message = this.validateMessage(request.message);
    const ids = this.validateIds(request.sessionId, request.userId);

    try {
      const response = await this.dispatchToWebhook(message, ids, request.attachments);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ChatServiceError(
          errorData.message || `Webhook returned status ${response.status}`,
          response.status,
        );
      }

      // Tentar ler a resposta
      const text = await response.text();

      console.log('[Chat Service] Response text length:', text.length);
      console.log('[Chat Service] Response text preview:', text.substring(0, 200));

      // Se a resposta estiver vazia, pode ser que o webhook processe de forma assíncrona
      if (!text || text.trim().length === 0) {
        console.log('[Chat Service] Webhook retornou resposta vazia - pode ser processamento assíncrono');
        // Retornar uma mensagem padrão ou aguardar
        return {
          output: 'Aguarde, processando sua mensagem...',
        };
      }

      let data;
      let history: unknown;
      try {
        data = JSON.parse(text);
        console.log('[Chat Service] Parsed JSON:', JSON.stringify(data).substring(0, 200));
        history = this.extractHistory(data);
      } catch {
        // Se não for JSON, tratar como texto simples
        console.log('[Chat Service] Não é JSON, tratando como texto');
        return {
          output: text,
        };
      }

      // O webhook pode retornar um array com objetos { output: "..." }
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if (firstItem.output) {
          console.log('[Chat Service] Resposta encontrada em array[0].output');
          return {
            output: firstItem.output,
            history,
          };
        }
      }

      // Tentar acessar output diretamente
      if (data.output) {
        console.log('[Chat Service] Resposta encontrada em data.output');
        return {
          output: data.output,
          history,
        };
      }

      // Se não tiver output, tentar outros campos possíveis
      if (data.message) {
        console.log('[Chat Service] Resposta encontrada em data.message');
        return { output: data.message, history };
      }
      if (data.response) {
        console.log('[Chat Service] Resposta encontrada em data.response');
        return { output: data.response, history };
      }
      if (data.text) {
        console.log('[Chat Service] Resposta encontrada em data.text');
        return { output: data.text, history };
      }
      // Se for uma string direta
      if (typeof data === 'string') {
        console.log('[Chat Service] Resposta é string direta');
        return { output: data, history };
      }

      console.error('[Chat Service] Formato de resposta não reconhecido:', JSON.stringify(data).substring(0, 500));
      throw new ChatServiceError('Invalid response format from webhook');
    } catch (error) {
      if (error instanceof ChatServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ChatServiceError(`Failed to communicate with chat service: ${error.message}`);
      }

      throw new ChatServiceError('Unknown error occurred while communicating with chat service');
    }
  }

  async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const message = this.validateMessage(request.message);
    const ids = this.validateIds(request.sessionId, request.userId);

    try {
      const response = await this.dispatchToWebhook(message, ids, request.attachments);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ChatServiceError(
          errorData.message || `Webhook returned status ${response.status}`,
          response.status,
        );
      }

      // Verificar se a resposta vem via streaming
      const contentType = response.headers.get('content-type');
      const transferEncoding = response.headers.get('transfer-encoding');

      console.log('[Chat Service] Webhook response headers:', {
        contentType,
        transferEncoding,
        status: response.status,
        ok: response.ok,
      });

      const isStreaming = contentType?.includes('text/event-stream') ||
                         transferEncoding === 'chunked' ||
                         response.body !== null;

      console.log('[Chat Service] Is streaming?', isStreaming);
      console.log('[Chat Service] Has body?', !!response.body);

      if (isStreaming && response.body) {
        // Processar resposta streaming do webhook
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Processar Server-Sent Events (SSE)
          if (contentType?.includes('text/event-stream')) {
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                console.log('[Chat Service] SSE data line:', data);
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    console.log('[Chat Service] Parsed JSON:', parsed);
                    if (parsed.output) {
                      console.log('[Chat Service] Sending chunk (output):', parsed.output);
                      onChunk(parsed.output);
                    } else if (parsed.chunk) {
                      console.log('[Chat Service] Sending chunk (chunk):', parsed.chunk);
                      onChunk(parsed.chunk);
                    } else if (typeof parsed === 'string') {
                      console.log('[Chat Service] Sending chunk (string):', parsed);
                      onChunk(parsed);
                    } else {
                      // Se for objeto mas não tem output/chunk, tentar enviar como string
                      console.log('[Chat Service] Sending chunk (object as string):', JSON.stringify(parsed));
                      onChunk(JSON.stringify(parsed));
                    }
                  } catch {
                    // Se não for JSON, enviar como texto
                    console.log('[Chat Service] Sending chunk (raw text):', data);
                    onChunk(data);
                  }
                }
              } else if (line.trim() && !line.startsWith(':') && !line.startsWith('event:')) {
                // Linha de texto simples
                console.log('[Chat Service] Sending chunk (simple line):', line);
                onChunk(line);
              }
            }
          } else {
            // Streaming de texto simples (chunked)
            // Enviar chunks conforme chegam
            const chunks = buffer.split(/\r?\n/);
            buffer = chunks.pop() || '';

            for (const chunk of chunks) {
              if (chunk.trim()) {
                try {
                  const parsed = JSON.parse(chunk);
                  if (parsed.output) {
                    onChunk(parsed.output);
                  }
                } catch {
                  // Se não for JSON válido, pode ser parte de um JSON maior
                  // Continuar acumulando no buffer
                  buffer = chunk + buffer;
                }
              }
            }
          }
        }

        // Processar buffer restante
        if (buffer.trim()) {
          if (contentType?.includes('text/event-stream') && buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data && data !== '[DONE]') {
              onChunk(data);
            }
          } else {
            try {
              const parsed = JSON.parse(buffer);
              if (parsed.output) {
                onChunk(parsed.output);
              }
            } catch {
              // Buffer incompleto, enviar mesmo assim
              if (buffer.trim()) {
                onChunk(buffer);
              }
            }
          }
        }
      } else {
        // Fallback: se não for streaming, retornar resposta completa
        console.log('[Chat Service] Not streaming, parsing JSON response');
        const data = await response.json();
        console.log('[Chat Service] JSON response:', JSON.stringify(data, null, 2));

        if (data.output) {
          console.log('[Chat Service] Sending full output:', data.output);
          onChunk(data.output);
        } else if (typeof data === 'string') {
          console.log('[Chat Service] Sending string response:', data);
          onChunk(data);
        } else {
          // Tentar enviar o objeto completo como string
          console.log('[Chat Service] Sending object as string:', JSON.stringify(data));
          onChunk(JSON.stringify(data));
        }
      }
    } catch (error) {
      if (error instanceof ChatServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ChatServiceError(`Failed to communicate with chat service: ${error.message}`);
      }

      throw new ChatServiceError('Unknown error occurred while communicating with chat service');
    }
  }

  private async dispatchToWebhook(message: string, ids: ChatIds, attachments?: ChatAttachment[]) {
    const payload: Record<string, unknown> = {
      input: message,
      ids,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments_metadata = attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.downloadUrl,
        expiresAt: attachment.expiresAt,
      }));
    }

    console.log('[Chat Service] Dispatch payload ids:', ids);
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  private validateMessage(message?: string): string {
    const trimmed = message?.trim();

    if (!trimmed) {
      throw new ChatValidationError('Message cannot be empty');
    }

    if (trimmed.length < MESSAGE_MIN_LENGTH) {
      throw new ChatValidationError(
        `Message must have at least ${MESSAGE_MIN_LENGTH} character`,
      );
    }

    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      throw new ChatValidationError(
        `Message must have at most ${MESSAGE_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateIds(sessionId?: string, userId?: string): ChatIds {
    const session = sessionId?.trim();
    const user = userId?.trim();

    if (!session) {
      throw new ChatValidationError('Session ID is required');
    }

    if (!user) {
      throw new ChatValidationError('User ID is required');
    }

    return {
      sessionId: session,
      userId: user,
    };
  }

  private extractHistory(payload: unknown): unknown {
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const history = this.extractHistory(item);
        if (history !== undefined) {
          return history;
        }
      }
      return undefined;
    }

    if (payload && typeof payload === 'object') {
      const candidate = (payload as { history?: unknown }).history;
      if (candidate !== undefined) {
        return candidate;
      }
    }

    return undefined;
  }
}
