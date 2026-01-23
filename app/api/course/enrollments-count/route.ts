import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { getDatabaseClient } from '@/backend/clients/database';

async function getEnrollmentsCountHandler(request: AuthenticatedRequest) {
  try {
    const db = getDatabaseClient();
    const empresaId = request.user?.empresaId;

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não identificada' }, { status: 400 });
    }

    // Get enrollment counts grouped by curso_id
    const { data, error } = await db
      .from('matriculas')
      .select('curso_id')
      .eq('empresa_id', empresaId);

    if (error) {
      console.error('[Enrollments Count API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count enrollments per course
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      if (row.curso_id) {
        counts[row.curso_id] = (counts[row.curso_id] || 0) + 1;
      }
    }

    return NextResponse.json({ data: counts });
  } catch (error) {
    console.error('[Enrollments Count API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return requireAuth(getEnrollmentsCountHandler)(request);
}
