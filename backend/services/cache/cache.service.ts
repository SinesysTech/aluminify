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
  private disabledUntilMs: number | null = null;
  private lastErrorLogMs: number = 0;
  private readonly networkFailureCooldownMs: number = 60_000;
  private readonly errorLogCooldownMs: number = 30_000;

  constructor() {
    this.initialize();
  }

  private isExplicitlyDisabled(): boolean {
    const value = process.env.CACHE_DISABLED;
    return value === '1' || value === 'true' || value === 'yes';
  }

  private shouldAttemptRedis(): boolean {
    if (!this.enabled || !this.redis) return false;
    if (this.disabledUntilMs === null) return true;
    if (Date.now() >= this.disabledUntilMs) {
      this.disabledUntilMs = null;
      return true;
    }
    return false;
  }

  private isNetworkLikeError(error: unknown): boolean {
    // Upstash client uses fetch under the hood; failures often come as TypeError('fetch failed')
    // with a nested `cause` containing Node.js network codes like ENOTFOUND.
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
      return true;
    }

    const maybeCause = (error as { cause?: unknown } | null)?.cause as
      | { code?: string; errno?: number; syscall?: string; hostname?: string }
      | undefined;

    const code = maybeCause?.code;
    if (!code) return false;

    return ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(code);
  }

  private temporarilyDisableRedis(error: unknown) {
    // Fail-open: cache becomes a no-op temporarily, system keeps working.
    this.disabledUntilMs = Date.now() + this.networkFailureCooldownMs;

    const now = Date.now();
    if (now - this.lastErrorLogMs >= this.errorLogCooldownMs) {
      this.lastErrorLogMs = now;
      console.warn(
        `[Cache Service] ⚠️ Redis indisponível (desabilitando cache por ${Math.round(
          this.networkFailureCooldownMs / 1000,
        )}s):`,
        error,
      );
    }
  }

  private initialize() {
    if (this.isExplicitlyDisabled()) {
      this.enabled = false;
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Cache Service] ⚠️ CACHE_DISABLED ativo - cache desabilitado');
      }
      return;
    }

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
      // Aviso apenas em desenvolvimento - não poluir logs de produção
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Cache Service] ⚠️ Redis não configurado - cache desabilitado');
        console.debug('[Cache Service] ⚠️ Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para habilitar cache');
      }
      this.enabled = false;
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.shouldAttemptRedis()) {
      return null;
    }

    try {
      const data = await this.redis!.get<T>(key);
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
      if (this.isNetworkLikeError(error)) {
        if (typeof window === 'undefined') {
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordError();
        }
        this.temporarilyDisableRedis(error);
        return null;
      }

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
    if (!this.shouldAttemptRedis()) {
      return;
    }

    try {
      await this.redis!.setex(key, ttlSeconds, value);
      console.log(`[Cache] 💾 Set: ${key} (TTL: ${ttlSeconds}s)`);
      // Registrar set no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordSet();
      }
    } catch (error) {
      if (this.isNetworkLikeError(error)) {
        if (typeof window === 'undefined') {
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordError();
        }
        this.temporarilyDisableRedis(error);
        return;
      }

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
    if (!this.shouldAttemptRedis()) {
      return;
    }

    try {
      await this.redis!.del(key);
      console.log(`[Cache] 🗑️ Del: ${key}`);
      // Registrar delete no monitor
      if (typeof window === 'undefined') {
        const { cacheMonitorService } = await import('./cache-monitor.service');
        cacheMonitorService.recordDel();
      }
    } catch (error) {
      if (this.isNetworkLikeError(error)) {
        if (typeof window === 'undefined') {
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordError();
        }
        this.temporarilyDisableRedis(error);
        return;
      }

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
    if (!this.shouldAttemptRedis() || keys.length === 0) {
      return;
    }

    try {
      // Upstash Redis suporta múltiplas chaves no del
      await Promise.all(keys.map(key => this.redis!.del(key)));
      console.log(`[Cache] 🗑️ Del Many: ${keys.length} chaves`);
    } catch (error) {
      if (this.isNetworkLikeError(error)) {
        if (typeof window === 'undefined') {
          const { cacheMonitorService } = await import('./cache-monitor.service');
          cacheMonitorService.recordError();
        }
        this.temporarilyDisableRedis(error);
        return;
      }

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









