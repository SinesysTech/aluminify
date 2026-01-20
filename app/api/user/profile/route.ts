import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import type { Database } from '@/lib/database.types';

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

    const metadataRole = (user.user_metadata?.role as string) || 'aluno';
    // Normalize legacy role names
    const role = metadataRole === 'professor' || metadataRole === 'empresa' ? 'usuario' : metadataRole;

    // Para usuarios (staff), empresa_id é derivado da tabela `usuarios` (fonte de verdade)
    let empresaId: string | null = null;
    let isEmpresaAdmin: boolean | null = null;
    let fullName: string | null = null;
    let roleType: string | null = null;

    if (role === 'usuario' || role === 'superadmin' || metadataRole === 'professor' || metadataRole === 'empresa') {
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
        roleType = papelData?.tipo ?? null;
        // admin and professor_admin are empresa admins
        isEmpresaAdmin = roleType === 'admin' || roleType === 'professor_admin';
      } else {
        // Fallback para metadata evita UX quebrada
        empresaId = (user.user_metadata?.empresa_id as string | undefined) ?? null;
        isEmpresaAdmin = (user.user_metadata?.is_admin as boolean | undefined) ?? null;
        fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
      }
    } else {
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
      isEmpresaAdmin,
    });
  } catch (e) {
    console.error('Error in /api/user/profile:', e);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}


