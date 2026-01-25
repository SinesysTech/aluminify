import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { AuthUser } from "@/app/[tenant]/auth/middleware";

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
  request?: NextRequest,
  authUser?: AuthUser | null,
): Promise<EmpresaContext> {
  if (!userId) {
    return { empresaId: null, isSuperAdmin: false };
  }

  // Verificar se é superadmin - usar authUser se disponível
  // Não tentar obter do client.auth.getUser() pois pode causar erro de permissão
  let isSuperAdmin = false;
  if (authUser) {
    isSuperAdmin = authUser.isSuperAdmin || authUser.role === "superadmin";
  }
  // Se authUser não foi fornecido, assumir que não é superadmin
  // (evita tentar acessar auth.users que pode causar erro de permissão)

  // Se for superadmin, permitir acessar empresa via query param
  if (isSuperAdmin && request) {
    const empresaIdParam = request.nextUrl.searchParams.get("empresa_id");
    if (empresaIdParam) {
      return { empresaId: empresaIdParam, isSuperAdmin: true };
    }
  }

  // Buscar empresa_id do usuário (tabela usuarios)
  const { data: usuario, error } = await client
    .from("usuarios")
    .select("empresa_id")
    .eq("id", userId)
    .eq("ativo", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error fetching usuario empresa_id:", error);
    // Se não encontrar registro do usuário, tentar buscar do metadata
    // Isso pode acontecer se a trigger ainda não executou
    // Usar authUser se disponível, senão não tentar acessar client.auth.getUser()
    if (authUser) {
      const empresaIdFromMetadata =
        (
          authUser as {
            user_metadata?: { empresa_id?: string };
            empresaId?: string;
          }
        )?.user_metadata?.empresa_id ||
        (authUser as { empresaId?: string })?.empresaId;
      if (empresaIdFromMetadata) {
        return {
          empresaId: empresaIdFromMetadata,
          isSuperAdmin,
        };
      }
    }
    return { empresaId: null, isSuperAdmin };
  }

  // Se não encontrou registro do usuário mas tem empresa_id no metadata, usar metadata
  // Usar authUser.empresaId se disponível
  if (!usuario?.empresa_id && authUser?.empresaId) {
    return {
      empresaId: authUser.empresaId,
      isSuperAdmin,
    };
  }

  return {
    empresaId: usuario?.empresa_id ?? null,
    isSuperAdmin,
  };
}

/**
 * Valida se o usuário tem acesso à empresa especificada
 */
export function validateEmpresaAccess(
  context: EmpresaContext,
  empresaId: string | null,
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
