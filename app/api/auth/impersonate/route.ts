import { NextResponse } from "next/server";
import {
  requireUserAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import {
  setImpersonationContext,
  canImpersonateUser,
} from "@/app/shared/core/auth-impersonate";
import { invalidateAuthSessionCache } from "@/app/shared/core/auth";
import type { PapelBase } from "@/app/shared/types";
import type { Database } from "@/app/shared/core/database.types";

async function postHandler(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { targetId } = body;
    const { studentId } = body;

    // Backward compatibility
    if (!targetId && studentId) {
      targetId = studentId;
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "ID do usuário alvo é obrigatório" },
        { status: 400 },
      );
    }

    const client = getDatabaseClient();

    // 1. Buscar usuário alvo
    const { data: targetUser, error: targetError } = await client
      .from("usuarios")
      .select("id, email, empresa_id, papel_id")
      .eq("id", targetId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Usuário alvo não encontrado" },
        { status: 404 },
      );
    }

    // 2. Determinar papel e empresa do alvo
    let targetRole: PapelBase = "aluno";
    let targetEmpresaId: string | undefined =
      targetUser.empresa_id || undefined;

    // Se tem papel_id, é um usuário da equipe ("usuario")
    if (targetUser.papel_id) {
      targetRole = "usuario";
    } else {
      // Se não tem papel_id, assumimos que é aluno (comportamento padrão)
      // Mas checamos se tem empresa vinculada via cursos (caso não tenha empresa_id direto)
      if (!targetEmpresaId) {
        const { data: alunoCurso } = await client
          .from("alunos_cursos")
          .select("curso_id, cursos(empresa_id)")
          .eq("usuario_id", targetId)
          .limit(1)
          .maybeSingle();

        // Type assertion for joined query result
        type AlunoCursoWithEmpresa = {
          curso_id: string;
          cursos: { empresa_id: string } | null;
        };
        const typedAlunoCurso = alunoCurso as AlunoCursoWithEmpresa | null;

        if (typedAlunoCurso?.cursos?.empresa_id) {
          targetEmpresaId = typedAlunoCurso.cursos.empresa_id;
        }
      }
    }

    // 3. Buscar dados do usuário real (requester) para validação
    let realUserEmpresaId: string | undefined;
    if (request.user.role === "usuario") {
      const { data: professor } = await client
        .from("usuarios")
        .select("empresa_id")
        .eq("id", request.user.id)
        .maybeSingle();

      realUserEmpresaId = professor?.empresa_id || undefined;
    }

    // 4. Validar permissão
    const validation = canImpersonateUser(
      request.user.role as PapelBase,
      realUserEmpresaId,
      targetId,
      targetRole,
      targetEmpresaId,
    );

    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason || "Não autorizado" },
        { status: 403 },
      );
    }

    // 5. Criar contexto
    const context = {
      realUserId: request.user.id,
      realUserRole: request.user.role as PapelBase,
      impersonatedUserId: targetId,
      impersonatedUserRole: targetRole,
      startedAt: new Date().toISOString(),
    };

    await setImpersonationContext(context);
    await invalidateAuthSessionCache(request.user.id);

    return NextResponse.json({
      success: true,
      context: {
        ...context,
        impersonatedUser: {
          id: targetUser.id,
          email: targetUser.email,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao iniciar impersonação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export const POST = requireUserAuth(postHandler);
