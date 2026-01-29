import { NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";

import type { AppUserRole } from "@/app/shared/types/entities/user";
import type { RoleTipo } from "@/app/shared/types/entities/papel";
import { isAdminRoleTipo } from "@/app/shared/core/roles";

/**
 * GET /api/usuario/perfil
 * Retorna dados básicos do usuário logado (role, empresaId, etc).
 *
 * Usado pelas telas em `app/(dashboard)/empresa/detalhes/*`.
 *
 * IMPORTANTE: Usa getDatabaseClient() (service role) para buscar dados da tabela usuarios
 * para evitar problemas de RLS que podem bloquear a consulta em alguns cenários.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.user_metadata?.role as AppUserRole) || "aluno";

    // Para usuarios (staff), empresa_id é derivado da tabela `usuarios` (fonte de verdade)
    let empresaId: string | null = null;
    let fullName: string | null = null;
    let roleType: RoleTipo | null = null;

    if (role === "usuario") {
      // Use service role client to bypass RLS for reliable data access
      const adminClient = getDatabaseClient();

      // Query 1: Get usuario data
      const { data: usuarioRow, error: usuarioError } = await adminClient
        .from("usuarios")
        .select("empresa_id, nome_completo, papel_id")
        .eq("id", user.id)
        .eq("ativo", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (!usuarioError && usuarioRow) {
        empresaId = usuarioRow.empresa_id;
        fullName = usuarioRow.nome_completo;

        // Query 2: Get papel data
        if (usuarioRow.papel_id) {
          const { data: papelRow } = await adminClient
            .from("papeis")
            .select("tipo")
            .eq("id", usuarioRow.papel_id)
            .maybeSingle();

          if (papelRow) {
            roleType = papelRow.tipo as RoleTipo;
          }
        }
      }
    } else if (role === "aluno") {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("nome_completo")
        .eq("id", user.id)
        .maybeSingle();

      // Type assertion: Query result properly typed from Database schema
      type UsuarioProfile = { nome_completo: string | null };
      const typedUsuario = usuario as UsuarioProfile | null;

      fullName =
        typedUsuario?.nome_completo ??
        (user.user_metadata?.full_name as string | undefined) ??
        null;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role,
      roleType,
      fullName,
      empresaId,
      // Derived from roleType for convenience
      isAdmin: roleType ? isAdminRoleTipo(roleType) : false,
    });
  } catch (e) {
    console.error("Error in /api/usuario/perfil:", e);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 },
    );
  }
}
