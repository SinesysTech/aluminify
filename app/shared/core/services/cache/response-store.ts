/**
 * Response Store - Armazenamento de respostas do chat
 *
 * Armazena respostas temporárias do agente de chat em memória.
 * Usa Map em memória com limpeza automática de entradas expiradas.
 */

export interface ChatResponseData {
  chunks: string[];
  isComplete: boolean;
  timestamp: number;
}

class ResponseStore {
  private memoryStore: Map<string, ChatResponseData> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMemoryCleanup();
  }

  /**
   * Armazenar resposta ou adicionar chunk
   */
  async set(sessionId: string, data: ChatResponseData): Promise<void> {
    this.memoryStore.set(sessionId, data);
  }

  /**
   * Obter resposta armazenada
   */
  async get(sessionId: string): Promise<ChatResponseData | null> {
    return this.memoryStore.get(sessionId) || null;
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
    this.memoryStore.delete(sessionId);
  }

  /**
   * Verificar se há resposta disponível
   */
  async has(sessionId: string): Promise<boolean> {
    return this.memoryStore.has(sessionId);
  }

  /**
   * Obter estatísticas do armazenamento
   */
  getStats(): { type: 'memory'; itemCount: number } {
    return {
      type: 'memory',
      itemCount: this.memoryStore.size,
    };
  }

  /**
   * Iniciar limpeza automática do Map em memória
   * Remove respostas com mais de 10 minutos
   */
  private startMemoryCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutos

      for (const [sessionId, data] of this.memoryStore.entries()) {
        if (now - data.timestamp > maxAge) {
          this.memoryStore.delete(sessionId);
        }
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
