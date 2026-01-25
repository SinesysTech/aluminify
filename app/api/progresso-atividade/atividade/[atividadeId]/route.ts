import { NextResponse, type NextRequest } from "next/server";
import {
  progressoAtividadeService,
  ProgressoNotFoundError,
  ProgressoValidationError,
} from "@/app/[tenant]/(dashboard)/atividades/services";
import {
  atividadeService,
  atividadeRequerDesempenho,
} from "@/app/[tenant]/(dashboard)/atividades/services";
import {
  requireAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import type { StatusAtividade } from "@/app/[tenant]/(dashboard)/atividades/services";

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

interface RouteContext {
  params: Promise<{ atividadeId: string }>;
}

// PATCH: Atualizar progresso de uma atividade (por atividadeId)
async function patchHandler(
  request: AuthenticatedRequest,
  params: { atividadeId: string },
) {
  try {
    // Usar aluno_id do usuário autenticado
    const alunoId = request.user?.id;
    if (!alunoId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar permissão: aluno só pode atualizar seu próprio progresso
    if (
      request.user &&
      request.user.role !== "usuario" &&
      request.user.role !== "superadmin"
    ) {
      // Já validado acima, alunoId é do usuário autenticado
    }

    const body = await request.json();
    const status = body?.status as StatusAtividade | undefined;
    if (!status) {
      return NextResponse.json(
        { error: "Missing parameter: status is required" },
        { status: 400 },
      );
    }

    // Se for concluir, verificar se precisa de dados de desempenho
    if (status === "Concluido" && body.desempenho) {
      // Buscar atividade para validar tipo
      const atividade = await atividadeService.getById(params.atividadeId);

      // Validar se o tipo requer desempenho
      if (atividadeRequerDesempenho(atividade.tipo)) {
        // Validar dados de desempenho
        const desempenho = body.desempenho;
        // Importante: questoesAcertos pode ser 0, então não podemos validar com "falsy"
        if (
          desempenho.questoesTotais == null ||
          desempenho.questoesAcertos == null ||
          desempenho.dificuldadePercebida == null
        ) {
          return NextResponse.json(
            {
              error:
                "Este tipo de atividade requer registro completo de desempenho (questões totais, acertos e dificuldade)",
            },
            { status: 400 },
          );
        }

        // Marcar como concluído com desempenho
        const updated =
          await progressoAtividadeService.marcarComoConcluidoComDesempenho(
            alunoId,
            params.atividadeId,
            {
              questoesTotais: desempenho.questoesTotais,
              questoesAcertos: desempenho.questoesAcertos,
              dificuldadePercebida: desempenho.dificuldadePercebida,
              anotacoesPessoais: desempenho.anotacoesPessoais || null,
            },
          );
        return NextResponse.json({ data: serializeProgresso(updated) });
      }
      // Se não requer desempenho, continuar com updateStatus normal
    } else if (status === "Concluido") {
      // Verificar se requer desempenho mas não foi fornecido
      const atividade = await atividadeService.getById(params.atividadeId);
      if (atividadeRequerDesempenho(atividade.tipo)) {
        return NextResponse.json(
          {
            error:
              'Este tipo de atividade requer registro de desempenho. Forneça os dados no campo "desempenho".',
          },
          { status: 400 },
        );
      }
    }

    // Atualização normal (Iniciado, Pendente, ou Concluido sem desempenho)
    const updated = await progressoAtividadeService.updateStatus(
      alunoId,
      params.atividadeId,
      status,
    );
    return NextResponse.json({ data: serializeProgresso(updated) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => patchHandler(req, params))(request);
}
