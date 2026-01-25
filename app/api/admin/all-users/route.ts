import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';

interface EmpresaInfo {
  id: string;
  nome: string;
}

interface ProfessorWithEmpresa {
  id: string;
  email: string;
  nome_completo: string | null;
  is_admin: boolean;
  empresa_id: string;
  empresas: EmpresaInfo | null;
  created_at: string;
  updated_at: string;
}

type RawProfessor = {
  id: unknown;
  email: unknown;
  nome_completo: unknown;
  is_admin: unknown;
  empresa_id: unknown;
  empresas?: EmpresaInfo[] | EmpresaInfo | null;
  created_at: unknown;
  updated_at: unknown;
};

/**
 * GET /api/admin/all-users
 * Lista todos os professores de todas as empresas (apenas superadmin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode listar todos os usuários.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Buscar todos os professores com informações da empresa
    const { data: professores, error } = await supabase
      .from('professores')
      .select(`
        id,
        email,
        nome_completo,
        is_admin,
        empresa_id,
        empresas!professores_empresa_id_fkey (
          id,
          nome
        ),
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const professoresFormatados: ProfessorWithEmpresa[] = (professores || []).map((p: RawProfessor) => {
      const empresa = Array.isArray(p.empresas) ? (p.empresas[0] ?? null) : (p.empresas ?? null);
      return {
        id: String(p.id),
        email: String(p.email),
        nome_completo: p.nome_completo == null ? null : String(p.nome_completo),
        is_admin: Boolean(p.is_admin),
        empresa_id: String(p.empresa_id),
        empresas: empresa ? { id: String(empresa.id), nome: String(empresa.nome) } : null,
        created_at: String(p.created_at),
        updated_at: String(p.updated_at),
      };
    });

    return NextResponse.json(professoresFormatados);
  } catch (error) {
    console.error('Error listing all users:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

