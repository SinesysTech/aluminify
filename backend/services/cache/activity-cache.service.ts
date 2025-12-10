/**
 * Activity Cache Service
 * 
 * Cache para estrutura de atividades por módulo (sem progresso do aluno)
 * TTL: 30 minutos
 */

import { cacheService } from './cache.service';
import { getDatabaseClient } from '@/backend/clients/database';

export interface CachedActivity {
  id: string;
  moduloId: string;
  tipo: string;
  titulo: string;
  arquivoUrl: string | null;
  gabaritoUrl: string | null;
  linkExterno: string | null;
  obrigatorio: boolean;
  ordemExibicao: number;
  createdAt: string;
  updatedAt: string;
}

interface ActivityRow {
  id: string;
  modulo_id: string;
  tipo: string;
  titulo: string;
  arquivo_url: string | null;
  gabarito_url: string | null;
  link_externo: string | null;
  obrigatorio: boolean;
  ordem_exibicao: number;
  created_at: string;
  updated_at: string;
}

class ActivityCacheService {
  /**
   * Obter atividades de um módulo (estrutura apenas, sem progresso)
   */
  async getActivitiesByModulo(moduloId: string): Promise<CachedActivity[]> {
    const cacheKey = `cache:modulo:${moduloId}:atividades`;
    
    return cacheService.getOrSet(
      cacheKey,
      () => this.fetchActivitiesFromDB(moduloId),
      1800 // TTL: 30 minutos
    );
  }

  /**
   * Invalidar cache de atividades de um módulo
   */
  async invalidateModulo(moduloId: string): Promise<void> {
    await cacheService.del(`cache:modulo:${moduloId}:atividades`);
  }

  /**
   * Invalidar cache de atividades de múltiplos módulos
   */
  async invalidateModulos(moduloIds: string[]): Promise<void> {
    const keys = moduloIds.map(id => `cache:modulo:${id}:atividades`);
    await cacheService.delMany(keys);
  }

  private async fetchActivitiesFromDB(moduloId: string): Promise<CachedActivity[]> {
    const client = getDatabaseClient();
    
    const { data, error } = await client
      .from('atividades')
      .select('id, modulo_id, tipo, titulo, arquivo_url, gabarito_url, link_externo, obrigatorio, ordem_exibicao, created_at, updated_at')
      .eq('modulo_id', moduloId)
      .order('ordem_exibicao', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((row: ActivityRow) => ({
      id: row.id,
      moduloId: row.modulo_id,
      tipo: row.tipo,
      titulo: row.titulo,
      arquivoUrl: row.arquivo_url,
      gabaritoUrl: row.gabarito_url,
      linkExterno: row.link_externo,
      obrigatorio: row.obrigatorio,
      ordemExibicao: row.ordem_exibicao,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

export const activityCacheService = new ActivityCacheService();
