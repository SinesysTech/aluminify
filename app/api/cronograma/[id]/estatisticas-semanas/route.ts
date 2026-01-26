import { NextResponse } from "next/server";
import {
  cronogramaService,
  CronogramaValidationError,
} from "@/app/[tenant]/(modules)/cronograma/services";
import {
  requireUserAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

function handleError(error: unknown) {
  if (error instanceof CronogramaValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log detalhado do erro
  console.error("Estatísticas Semanas API Error:", error);

  // Extrair mensagem de erro mais detalhada
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
  params: Promise<{ id: string }> | { id: string };
}

async function getHandler(
  request: AuthenticatedRequest,
  context?: RouteContext | Record<string, unknown>,
) {
  console.log("[Estatísticas Semanas API] Recebendo requisição GET");

  if (!request.user) {
    console.error("[Estatísticas Semanas API] Usuário não autenticado");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Suporta tanto Next.js 15+ (Promise) quanto versões anteriores
    let cronogramaId: string | null = null;

    if (context) {
      if ("params" in context) {
        const params =
          context.params instanceof Promise
            ? await context.params
            : context.params;

        if (params && typeof params === "object" && "id" in params) {
          cronogramaId = params.id as string;
        }
      } else if ("id" in context) {
        // Fallback: se o id estiver diretamente no contexto
        cronogramaId = context.id as string;
      }
    }

    // Se ainda não encontrou, tenta extrair da URL
    if (!cronogramaId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const idIndex = pathParts.indexOf("estatisticas-semanas") - 1;
      if (idIndex >= 0 && pathParts[idIndex]) {
        cronogramaId = pathParts[idIndex];
      }
    }

    if (!cronogramaId) {
      return NextResponse.json(
        {
          error: "ID do cronograma é obrigatório",
        },
        { status: 400 },
      );
    }

    console.log(
      "[Estatísticas Semanas API] Calculando estatísticas para cronograma:",
      cronogramaId,
    );
    const result = await cronogramaService.calcularEstatisticasPorSemana(
      cronogramaId,
      request.user.id,
    );
    console.log(
      "[Estatísticas Semanas API] Estatísticas calculadas com sucesso",
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Estatísticas Semanas GET] Error:", error);
    console.error(
      "[Estatísticas Semanas GET] Error type:",
      error?.constructor?.name,
    );
    console.error(
      "[Estatísticas Semanas GET] Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "[Estatísticas Semanas GET] Error stack:",
      error instanceof Error ? error.stack : "N/A",
    );
    return handleError(error);
  }
}

export const GET = requireUserAuth(getHandler);
