/**
 * Cache Service - Serviço genérico de cache usando Redis (Upstash)
 *
 * Este serviço fornece uma interface simples para cache de dados no Redis.
 * Suporta fallback gracioso quando Redis não está configurado.
 */

import { Redis } from '@upstash/redis';

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.enabled = true;
        console.log('[Cache Service] ✅ Redis configurado - cache habilitado');
      } catch (error) {
        console.error('[Cache Service] ❌ Erro ao configurar Redis:', error);
        console.warn('[Cache Service] ⚠️ Cache desabilitado - sistema funcionará sem cache');
        this.enabled = false;
      }
    } else {
      console.warn('[Cache Service] ⚠️ Redis não configurado - cache desabilitado');
      console.warn('[Cache Service] ⚠️ Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para habilitar cache');
      this.enabled = false;
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get<T>(key);
      if (data !== null) {
        console.log(`[Cache] ✅ Hit: ${key}`);
        // Registrar hit no monitor
        if (typeof window === 'undefined') {
          // Apenas no servidor
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordHit();
        }
      } else {
        // Registrar miss no monitor
        if (typeof window === 'undefined') {
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordMiss();
        }
      }
      return data;
    } catch (error) {
      console.error(`[Cache] ❌ Erro ao ler chave ${key}:`, error);
      // Registrar erro no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordError();
      }
      return null;
    }
  }

  /**
   * Armazenar valor no cache com TTL
   * @param key - Chave do cache
   * @param value - Valor a ser armazenado (deve ser serializável)
   * @param ttlSeconds - Tempo de vida em segundos (padrão: 3600)
   */
  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, value);
      console.log(`[Cache] 💾 Set: ${key} (TTL: ${ttlSeconds}s)`);
      // Registrar set no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordSet();
      }
    } catch (error) {
      console.error(`[Cache] ❌ Erro ao escrever chave ${key}:`, error);
      // Registrar erro no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordError();
      }
    }
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
      console.log(`[Cache] 🗑️ Del: ${key}`);
      // Registrar delete no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordDel();
      }
    } catch (error) {
      console.error(`[Cache] ❌ Erro ao deletar chave ${key}:`, error);
      // Registrar erro no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordError();
      }
    }
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMany(keys: string[]): Promise<void> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return;
    }

    try {
      // Upstash Redis suporta múltiplas chaves no del
      await Promise.all(keys.map(key => this.redis!.del(key)));
      console.log(`[Cache] 🗑️ Del Many: ${keys.length} chaves`);
    } catch (error) {
      console.error(`[Cache] ❌ Erro ao deletar múltiplas chaves:`, error);
    }
  }

  /**
   * Verificar se cache está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Obter ou calcular valor (padrão cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Tentar obter do cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - buscar e armazenar
    console.log(`[Cache] ❌ Miss: ${key}`);
    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

// Singleton
export const cacheService = new CacheService();







