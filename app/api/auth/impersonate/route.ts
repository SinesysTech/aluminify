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
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar dados do aluno a ser impersonado
    const client = getDatabaseClient();
    const { data: aluno, error: alunoError } = await client
      .from("usuarios")
      .select("id, email")
      .eq("id", studentId)
      .maybeSingle();

    // Type assertion: Query result properly typed from Database schema
    type AlunoBasic = Pick<
      Database["public"]["Tables"]["usuarios"]["Row"],
      "id" | "email"
    >;
    const typedAluno = aluno as AlunoBasic | null;

    if (alunoError || !typedAluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 },
      );
    }

    // Buscar empresa_id do aluno (se houver matrícula em alunos_cursos)
    const { data: alunoCurso } = await client
      .from("alunos_cursos")
      .select("curso_id, cursos(empresa_id)")
      .eq("usuario_id", studentId)
      .limit(1)
      .maybeSingle();

    // Type assertion for joined query result
    type AlunoCursoWithEmpresa = {
      curso_id: string;
      cursos: { empresa_id: string } | null;
    };
    const typedAlunoCurso = alunoCurso as AlunoCursoWithEmpresa | null;
    const alunoEmpresaId = typedAlunoCurso?.cursos?.empresa_id;

    // Buscar empresa_id do usuário real (se for professor/usuario)
    let realUserEmpresaId: string | undefined;
    if (request.user.role === "usuario") {
      const { data: professor } = await client
        .from("usuarios")
        .select("empresa_id")
        .eq("id", request.user.id)
        .maybeSingle();

      // Type assertion: Query result properly typed from Database schema
      type ProfessorEmpresa = Pick<
        Database["public"]["Tables"]["usuarios"]["Row"],
        "empresa_id"
      >;
      const typedProfessor = professor as ProfessorEmpresa | null;

      realUserEmpresaId = typedProfessor?.empresa_id || undefined;
    }

    // Validar se pode impersonar
    const validation = canImpersonateUser(
      request.user.role as PapelBase,
      realUserEmpresaId,
      studentId,
      "aluno",
      alunoEmpresaId,
    );

    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason || "Não autorizado" },
        { status: 403 },
      );
    }

    // Criar contexto de impersonação
    const context = {
      realUserId: request.user.id,
      realUserRole: request.user.role as PapelBase,
      impersonatedUserId: studentId,
      impersonatedUserRole: "aluno" as PapelBase,
      startedAt: new Date().toISOString(),
    };

    await setImpersonationContext(context);
    await invalidateAuthSessionCache(request.user.id);

    return NextResponse.json({
      success: true,
      context: {
        ...context,
        impersonatedUser: {
          id: typedAluno.id,
          email: typedAluno.email,
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
