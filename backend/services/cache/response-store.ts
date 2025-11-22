/**
 * Response Store - Armazenamento de respostas do chat
 *
 * Este serviço gerencia o armazenamento temporário de respostas do agente de chat.
 * Suporta tanto Upstash Redis (para produção/serverless) quanto Map em memória (fallback local).
 *
 * IMPORTANTE: O Map em memória NÃO funciona em ambientes serverless (Vercel, AWS Lambda)
 * porque cada requisição pode rodar em uma instância diferente.
 * Use Upstash Redis em produção configurando as variáveis de ambiente.
 */

import { Redis } from '@upstash/redis';

export interface ChatResponseData {
  chunks: string[];
  isComplete: boolean;
  timestamp: number;
}

class ResponseStore {
  private redis: Redis | null = null;
  private memoryStore: Map<string, ChatResponseData> = new Map();
  private useRedis: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeStore();
  }

  private initializeStore() {
    // Verificar se as variáveis de ambiente do Upstash Redis estão configuradas
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.useRedis = true;
        console.log('[Response Store] ✅ Upstash Redis configurado - usando Redis para armazenamento');
      } catch (error) {
        console.error('[Response Store] ❌ Erro ao configurar Upstash Redis:', error);
        console.log('[Response Store] ⚠️  Fallback para Map em memória (NÃO funciona em serverless!)');
        this.useRedis = false;
        // Iniciar limpeza automática quando Redis falha na inicialização
        this.startMemoryCleanup();
      }
    } else {
      console.warn('[Response Store] ⚠️  AVISO: Upstash Redis não configurado!');
      console.warn('[Response Store] ⚠️  Usando Map em memória - NÃO funcionará em ambientes serverless (Vercel, AWS Lambda)');
      console.warn('[Response Store] ⚠️  Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para produção');
      this.useRedis = false;

      // Iniciar limpeza automática apenas para Map em memória
      this.startMemoryCleanup();
    }
  }

  /**
   * Armazenar resposta ou adicionar chunk
   */
  async set(sessionId: string, data: ChatResponseData): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const key = this.getRedisKey(sessionId);
        // Armazenar no Redis com TTL de 10 minutos
        // Upstash REST API lida com JSON automaticamente
        await this.redis.setex(key, 600, data);
        console.log(`[Response Store] Redis SET: ${key} - ${data.chunks.length} chunks`);
      } catch (error) {
        console.error('[Response Store] Erro ao armazenar no Redis:', error);
        // Fallback para memória em caso de erro
        this.memoryStore.set(sessionId, data);
      }
    } else {
      this.memoryStore.set(sessionId, data);
      console.log(`[Response Store] Memory SET: ${sessionId} - ${data.chunks.length} chunks`);
    }
  }

  /**
   * Obter resposta armazenada
   */
  async get(sessionId: string): Promise<ChatResponseData | null> {
    if (this.useRedis && this.redis) {
      try {
        const key = this.getRedisKey(sessionId);
        // Upstash REST API retorna o valor diretamente como objeto se for JSON
        const data = await this.redis.get<ChatResponseData>(key);

        if (!data) {
          console.log(`[Response Store] Redis GET: ${key} - não encontrado`);
          return null;
        }

        console.log(`[Response Store] Redis GET: ${key} - ${data.chunks.length} chunks, complete: ${data.isComplete}`);
        return data;
      } catch (error) {
        console.error('[Response Store] Erro ao ler do Redis:', error);
        // Fallback para memória em caso de erro
        return this.memoryStore.get(sessionId) || null;
      }
    } else {
      const data = this.memoryStore.get(sessionId) || null;
      if (data) {
        console.log(`[Response Store] Memory GET: ${sessionId} - ${data.chunks.length} chunks, complete: ${data.isComplete}`);
      } else {
        console.log(`[Response Store] Memory GET: ${sessionId} - não encontrado`);
      }
      return data;
    }
  }

  /**
   * Adicionar chunk a uma resposta existente
   */
  async addChunk(sessionId: string, chunk: string, isComplete: boolean = false): Promise<void> {
    const existing = await this.get(sessionId);

    const data: ChatResponseData = existing || {
      chunks: [],
      isComplete: false,
      timestamp: Date.now(),
    };

    data.chunks.push(chunk);
    // Garantir que uma vez marcada como completa, permaneça completa
    data.isComplete = isComplete || data.isComplete;
    data.timestamp = Date.now();

    await this.set(sessionId, data);
  }

  /**
   * Marcar resposta como completa
   */
  async markComplete(sessionId: string): Promise<void> {
    const existing = await this.get(sessionId);

    if (existing) {
      existing.isComplete = true;
      existing.timestamp = Date.now();
      await this.set(sessionId, existing);
    }
  }

  /**
   * Remover resposta
   */
  async delete(sessionId: string): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const key = this.getRedisKey(sessionId);
        await this.redis.del(key);
        console.log(`[Response Store] Redis DEL: ${key}`);
      } catch (error) {
        console.error('[Response Store] Erro ao deletar do Redis:', error);
        // Fallback para memória
        this.memoryStore.delete(sessionId);
      }
    } else {
      this.memoryStore.delete(sessionId);
      console.log(`[Response Store] Memory DEL: ${sessionId}`);
    }
  }

  /**
   * Verificar se há resposta disponível
   */
  async has(sessionId: string): Promise<boolean> {
    const data = await this.get(sessionId);
    return data !== null;
  }

  /**
   * Obter estatísticas do armazenamento
   */
  getStats(): { type: 'redis' | 'memory'; itemCount: number } {
    return {
      type: this.useRedis ? 'redis' : 'memory',
      itemCount: this.memoryStore.size,
    };
  }

  /**
   * Gerar chave do Redis
   */
  private getRedisKey(sessionId: string): string {
    return `chat:response:${sessionId}`;
  }

  /**
   * Iniciar limpeza automática do Map em memória
   * Remove respostas com mais de 10 minutos
   */
  private startMemoryCleanup() {
    // Limpar a cada 60 segundos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutos

      let removed = 0;
      for (const [sessionId, data] of this.memoryStore.entries()) {
        if (now - data.timestamp > maxAge) {
          this.memoryStore.delete(sessionId);
          removed++;
        }
      }

      if (removed > 0) {
        console.log(`[Response Store] Limpeza automática: ${removed} respostas antigas removidas`);
      }
    }, 60000);
  }

  /**
   * Parar limpeza automática (útil para testes)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton para compartilhar a mesma instância
const responseStore = new ResponseStore();

export { responseStore };
