import { NextResponse } from "next/server";
import {
  progressoAtividadeService,
  ProgressoNotFoundError,
  ProgressoValidationError,
} from "@/app/[tenant]/(modules)/sala-de-estudos/services/atividades";
import {
  requireAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

const serializeProgresso = (
  progresso: Awaited<
    ReturnType<typeof progressoAtividadeService.getProgressoById>
  >,
) => ({
  id: progresso.id,
  alunoId: progresso.alunoId,
  atividadeId: progresso.atividadeId,
  status: progresso.status,
  dataInicio: progresso.dataInicio?.toISOString() || null,
  dataConclusao: progresso.dataConclusao?.toISOString() || null,
  questoesTotais: progresso.questoesTotais,
  questoesAcertos: progresso.questoesAcertos,
  dificuldadePercebida: progresso.dificuldadePercebida,
  anotacoesPessoais: progresso.anotacoesPessoais,
  createdAt: progresso.createdAt.toISOString(),
  updatedAt: progresso.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof ProgressoNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ProgressoValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("Progresso API Error:", error);
  let errorMessage = "Internal server error";
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error("Error stack:", error.stack);
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message);
  }

  return NextResponse.json(
    {
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    },
    { status: 500 },
  );
}

// GET: Listar progresso do aluno
async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "Missing parameter: alunoId is required" },
        { status: 400 },
      );
    }

    // Verificar se o aluno está acessando seu próprio progresso ou se é professor
    if (
      request.user &&
      request.user.role !== "usuario" &&
      request.user.role !== "superadmin"
    ) {
      if (request.user.id !== alunoId) {
        return NextResponse.json(
          { error: "Forbidden: You can only access your own progress" },
          { status: 403 },
        );
      }
    }

    const progressos =
      await progressoAtividadeService.getProgressoByAluno(alunoId);
    return NextResponse.json({ data: progressos.map(serializeProgresso) });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
