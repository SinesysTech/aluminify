/**
 * User Profile Cache Service
 * 
 * Cache para dados de perfil de usuário (nome, role, etc.)
 * TTL: 5 minutos
 */

import { cacheService } from './cache.service';
import { getDatabaseClient } from '@/backend/clients/database';

export interface UserProfile {
  id: string;
  email: string;
  nomeCompleto?: string;
  role?: string;
  avatarUrl?: string;
}

class UserProfileCacheService {
  /**
   * Obter perfil do usuário (com cache)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `cache:user:${userId}:perfil`;
    
    return cacheService.getOrSet(
      cacheKey,
      () => this.fetchUserProfileFromDB(userId),
      300 // TTL: 5 minutos
    );
  }

  /**
   * Invalidar cache do perfil do usuário
   */
  async invalidateUserProfile(userId: string): Promise<void> {
    await cacheService.del(`cache:user:${userId}:perfil`);
  }

  private async fetchUserProfileFromDB(userId: string): Promise<UserProfile | null> {
    const client = getDatabaseClient();
    
    // Buscar dados do auth
    const { data: { user }, error: authError } = await client.auth.admin.getUserById(userId);
    
    if (authError || !user) {
      return null;
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role,
      avatarUrl: user.user_metadata?.avatar_url,
    };

    // Tentar buscar nome completo da tabela professores
    try {
      const { data: professor } = await client
        .from('professores')
        .select('nome_completo')
        .eq('id', userId)
        .maybeSingle();

      if (professor?.nome_completo) {
        profile.nomeCompleto = professor.nome_completo;
      }
    } catch (error) {
      // Ignorar erro - não é crítico
    }

    return profile;
  }
}

export const userProfileCacheService = new UserProfileCacheService();







