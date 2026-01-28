import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';

/**
 * GET /api/superadmin/check-empty-tables
 * Verifica se as tabelas principais estão vazias
 * Requer autenticação de superadmin
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode verificar as tabelas.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fallback: usar queries diretas
    const [alunosResult, professoresResult, adminsResult] = await Promise.all([
      supabase.from('alunos').select('id', { count: 'exact', head: true }),
      supabase.from('professores').select('id', { count: 'exact', head: true }),
      supabase.from('empresa_admins').select('empresa_id', { count: 'exact', head: true }),
    ]);

    const results = {
      'auth.users': 'N/A (não acessível via API)',
      'public.alunos': alunosResult.count ?? 0,
      'public.professores': professoresResult.count ?? 0,
      'public.empresa_admins': adminsResult.count ?? 0,
    };

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        allEmpty: results['public.alunos'] === 0 &&
                 results['public.professores'] === 0 &&
                 results['public.empresa_admins'] === 0,
        note: 'auth.users não pode ser verificada diretamente via API. Use o Supabase Dashboard ou MCP.'
      }
    });

  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar tabelas', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
