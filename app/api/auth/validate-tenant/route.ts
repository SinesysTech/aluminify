import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/shared/core/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";

/**
 * Valida se o usuário autenticado pertence a uma empresa (tenant).
 * Usado no login por tenant para bloquear acesso indevido.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const empresaId = typeof body?.empresaId === "string" ? body.empresaId : "";

    if (!empresaId) {
      return NextResponse.json(
        { valid: false, message: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const sessionClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { valid: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    // Superadmin pode acessar qualquer tenant
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const isSuperadmin =
      metadata.role === "superadmin" || metadata.is_superadmin === true;
    if (isSuperadmin) {
      return NextResponse.json({ valid: true, roles: ["superadmin"] });
    }

    const adminClient = getDatabaseClient();

    // Professor vinculado diretamente à empresa
    const { data: professorRow, error: professorError } = await adminClient
      .from("professores")
      .select("id")
      .eq("id", user.id)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (professorError) {
      console.error("[validate-tenant] erro ao verificar professor:", professorError);
    }

    if (professorRow?.id) {
      return NextResponse.json({ valid: true, roles: ["professor"] });
    }

    // Aluno vinculado via cursos -> empresa
    const { data: alunoCursoRow, error: alunoError } = await adminClient
      .from("alunos_cursos")
      .select("aluno_id, cursos!inner(empresa_id)")
      .eq("aluno_id", user.id)
      .eq("cursos.empresa_id", empresaId)
      .limit(1);

    if (alunoError) {
      console.error("[validate-tenant] erro ao verificar aluno:", alunoError);
    }

    if (Array.isArray(alunoCursoRow) && alunoCursoRow.length > 0) {
      return NextResponse.json({ valid: true, roles: ["aluno"] });
    }

    return NextResponse.json(
      { valid: false, message: "Você não tem acesso a esta instituição." },
      { status: 403 }
    );
  } catch (error) {
    console.error("[validate-tenant] erro inesperado:", error);
    return NextResponse.json(
      { valid: false, message: "Erro interno" },
      { status: 500 }
    );
  }
}

