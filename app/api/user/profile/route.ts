import { NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';
import type { Database } from '@/app/shared/core/database.types';
import type { AppUserRole } from '@/types/shared/entities/user';
import type { RoleTipo } from '@/types/shared/entities/papel';
import { isAdminRoleTipo } from '@/app/shared/core/roles';

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

    const role = (user.user_metadata?.role as AppUserRole) || 'aluno';

    // Para usuarios (staff), empresa_id é derivado da tabela `usuarios` (fonte de verdade)
    let empresaId: string | null = null;
    let fullName: string | null = null;
    let roleType: RoleTipo | null = null;

    if (role === 'usuario' || role === 'superadmin') {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select(`
          empresa_id,
          nome_completo,
          papeis!inner(tipo)
        `)
        .eq('id', user.id)
        .eq('ativo', true)
        .is('deleted_at', null)
        .maybeSingle();

      if (usuario) {
        empresaId = usuario.empresa_id;
        fullName = usuario.nome_completo;
        const papelData = usuario.papeis as unknown as { tipo: string } | null;
        roleType = (papelData?.tipo as RoleTipo) ?? null;
      } else {
        // Fallback para metadata (apenas para superadmin sem registro em usuarios)
        empresaId = (user.user_metadata?.empresa_id as string | undefined) ?? null;
        fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
      }
    } else if (role === 'aluno') {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('nome_completo')
        .eq('id', user.id)
        .maybeSingle();

      // Type assertion: Query result properly typed from Database schema
      type AlunoProfile = Pick<Database['public']['Tables']['alunos']['Row'], 'nome_completo'>;
      const typedAluno = aluno as AlunoProfile | null;

      fullName = typedAluno?.nome_completo ?? (user.user_metadata?.full_name as string | undefined) ?? null;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role,
      roleType,
      fullName,
      empresaId,
      // Derived from roleType for convenience
      isAdmin: roleType ? isAdminRoleTipo(roleType) : role === 'superadmin',
    });
  } catch (e) {
    console.error('Error in /api/user/profile:', e);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}
