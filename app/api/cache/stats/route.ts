import { NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { cacheMonitorService } from '@/backend/services/cache/cache-monitor.service';

/**
 * GET /api/cache/stats
 * Obter estatísticas de cache (apenas para superadmin)
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    
    // Apenas superadmin pode ver estatísticas
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = cacheMonitorService.getStats();
    
    return NextResponse.json({ 
      data: stats,
      cacheEnabled: cacheMonitorService.getStats().totalOperations > 0,
    });
  } catch (error) {
    console.error('[Cache Stats API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);













