import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";

import type { PapelBase } from "@/app/shared/types/entities/user";
import type { RoleTipo } from "@/app/shared/types/entities/papel";

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

    const role = (user.user_metadata?.role as PapelBase) || "aluno";

    // Para usuarios (staff), empresa_id é derivado da tabela `usuarios` (fonte de verdade)
    let empresaId: string | null = null;
    let fullName: string | null = null;
    let roleType: RoleTipo | null = null;
    let isAdmin = false;

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

        // Query 2: Get isAdmin from usuarios_empresas (new model)
        if (usuarioRow.empresa_id) {
          const { data: vinculoRow } = await adminClient
            .from("usuarios_empresas")
            .select("is_admin")
            .eq("usuario_id", user.id)
            .eq("empresa_id", usuarioRow.empresa_id)
            .eq("ativo", true)
            .maybeSingle();

          if (vinculoRow) {
            isAdmin = vinculoRow.is_admin ?? false;
          }
        }

        // Query 3: Get papel data (deprecated, kept for backwards compatibility)
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
      roleType, // deprecated, kept for backwards compatibility
      fullName,
      empresaId,
      isAdmin,
    });
  } catch (e) {
    console.error("Error in /api/usuario/perfil:", e);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/usuario/perfil
 * Atualiza dados editáveis do perfil do usuário logado.
 *
 * Body: { nome_completo?: string, telefone?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.nome_completo === "string") {
      const trimmed = body.nome_completo.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: "Nome não pode estar vazio" },
          { status: 400 },
        );
      }
      updates.nome_completo = trimmed;
    }

    if (body.telefone !== undefined) {
      updates.telefone = body.telefone ? String(body.telefone).trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 },
      );
    }

    const adminClient = getDatabaseClient();
    const { error: updateError } = await adminClient
      .from("usuarios")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar perfil" },
        { status: 500 },
      );
    }

    // Sync nome_completo to auth metadata
    if (updates.nome_completo) {
      await supabase.auth.updateUser({
        data: { full_name: updates.nome_completo },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in PUT /api/usuario/perfil:", e);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 },
    );
  }
}
