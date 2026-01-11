import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

/**
 * GET /api/user/profile
 * Retorna dados básicos do usuário logado (role, empresaId, etc).
 *
 * Usado pelas telas em `app/(dashboard)/admin/empresa/*`.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (user.user_metadata?.role as string) || 'aluno';

    // Para professores, empresa_id é derivado da tabela `professores` (fonte de verdade)
    let empresaId: string | null = null;
    let isEmpresaAdmin: boolean | null = null;
    let fullName: string | null = null;

    if (role === 'professor' || role === 'superadmin') {
      const { data: professor } = await supabase
        .from('professores')
        .select('empresa_id,is_admin,nome_completo')
        .eq('id', user.id)
        .maybeSingle();

      // `professores` é fonte de verdade, mas em cadastros recentes pode haver atraso/fluxo sem trigger.
      // Fallback para metadata evita UX quebrada (ex.: admin/empresa exibindo "Empresa não encontrada").
      empresaId =
        professor?.empresa_id ??
        ((user.user_metadata?.empresa_id as string | undefined) ?? null);
      isEmpresaAdmin =
        professor?.is_admin ??
        ((user.user_metadata?.is_admin as boolean | undefined) ?? null);
      fullName =
        professor?.nome_completo ??
        ((user.user_metadata?.full_name as string | undefined) ?? null);
    } else {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('nome_completo')
        .eq('id', user.id)
        .maybeSingle();

      fullName = aluno?.nome_completo ?? (user.user_metadata?.full_name as string | undefined) ?? null;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role,
      fullName,
      empresaId,
      isEmpresaAdmin,
    });
  } catch (e) {
    console.error('Error in /api/user/profile:', e);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}


