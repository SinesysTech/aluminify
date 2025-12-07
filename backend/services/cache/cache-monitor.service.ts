/**
 * Cache Monitor Service
 * 
 * Sistema básico de monitoramento de cache (hit/miss rate)
 */

import { cacheService } from './cache.service';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  dels: number;
  errors: number;
}

class CacheMonitorService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    dels: 0,
    errors: 0,
  };

  /**
   * Registrar hit de cache
   */
  recordHit(): void {
    this.stats.hits++;
  }

  /**
   * Registrar miss de cache
   */
  recordMiss(): void {
    this.stats.misses++;
  }

  /**
   * Registrar set de cache
   */
  recordSet(): void {
    this.stats.sets++;
  }

  /**
   * Registrar delete de cache
   */
  recordDel(): void {
    this.stats.dels++;
  }

  /**
   * Registrar erro de cache
   */
  recordError(): void {
    this.stats.errors++;
  }

  /**
   * Obter estatísticas atuais
   */
  getStats(): CacheStats & { hitRate: number; totalOperations: number } {
    const totalOperations = this.stats.hits + this.stats.misses;
    const hitRate = totalOperations > 0 
      ? (this.stats.hits / totalOperations) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100, // 2 casas decimais
      totalOperations,
    };
  }

  /**
   * Resetar estatísticas
   */
  reset(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      dels: 0,
      errors: 0,
    };
  }

  /**
   * Log de estatísticas (para debug)
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('[Cache Monitor] ===========================================');
    console.log('[Cache Monitor] Estatísticas de Cache:');
    console.log(`[Cache Monitor] Hits: ${stats.hits}`);
    console.log(`[Cache Monitor] Misses: ${stats.misses}`);
    console.log(`[Cache Monitor] Hit Rate: ${stats.hitRate}%`);
    console.log(`[Cache Monitor] Sets: ${stats.sets}`);
    console.log(`[Cache Monitor] Deletes: ${stats.dels}`);
    console.log(`[Cache Monitor] Errors: ${stats.errors}`);
    console.log(`[Cache Monitor] Total Operations: ${stats.totalOperations}`);
    console.log('[Cache Monitor] ===========================================');
  }
}

export const cacheMonitorService = new CacheMonitorService();
