import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface EmpresaContext {
  empresaId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Extrai o contexto de empresa do usuário logado
 * Busca empresa_id do professor logado ou permite superadmin acessar qualquer empresa
 */
export async function getEmpresaContext(
  client: SupabaseClient,
  userId: string | null,
  request?: NextRequest
): Promise<EmpresaContext> {
  if (!userId) {
    return { empresaId: null, isSuperAdmin: false };
  }

  // Verificar se é superadmin
  const { data: userData } = await client.auth.getUser();
  const isSuperAdmin = userData?.user?.user_metadata?.role === 'superadmin';

  // Se for superadmin, permitir acessar empresa via query param
  if (isSuperAdmin && request) {
    const empresaIdParam = request.nextUrl.searchParams.get('empresa_id');
    if (empresaIdParam) {
      return { empresaId: empresaIdParam, isSuperAdmin: true };
    }
  }

  // Buscar empresa_id do professor
  const { data: professor, error } = await client
    .from('professores')
    .select('empresa_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching professor empresa_id:', error);
    return { empresaId: null, isSuperAdmin };
  }

  return {
    empresaId: professor?.empresa_id ?? null,
    isSuperAdmin,
  };
}

/**
 * Valida se o usuário tem acesso à empresa especificada
 */
export function validateEmpresaAccess(
  context: EmpresaContext,
  empresaId: string | null
): boolean {
  if (!empresaId) {
    return false;
  }

  // Superadmin pode acessar qualquer empresa
  if (context.isSuperAdmin) {
    return true;
  }

  // Usuário deve pertencer à empresa
  return context.empresaId === empresaId;
}

