import { NextResponse } from "next/server";
import {
  cronogramaService,
  CronogramaService,
} from "@/app/[tenant]/(modules)/cronograma/services";
import {
  requireUserAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

function handleError(error: unknown) {
  if (error instanceof Error) {
    // Assuming Error
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("Distribuição Dias API Error:", error);

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
  if (!request.user) {
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
      const idIndex = pathParts.indexOf("distribuicao-dias") - 1;
      if (idIndex >= 0 && pathParts[idIndex]) {
        cronogramaId = pathParts[idIndex];
      }
    }

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "cronograma_id é obrigatório" },
        { status: 400 },
      );
    }

    const distribuicao = await cronogramaService.buscarDistribuicaoDias(
      cronogramaId,
      request.user.id,
    );

    return NextResponse.json({ success: true, distribuicao }, { status: 200 });
  } catch (error) {
    console.error("[Distribuição Dias GET] Error:", error);
    return handleError(error);
  }
}

async function putHandler(
  request: AuthenticatedRequest,
  context?: RouteContext | Record<string, unknown>,
) {
  if (!request.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Debug: log do contexto recebido
    console.log(
      "[PUT Distribuição Dias] Context recebido:",
      JSON.stringify(context, null, 2),
    );

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
      const idIndex = pathParts.indexOf("distribuicao-dias") - 1;
      if (idIndex >= 0 && pathParts[idIndex]) {
        cronogramaId = pathParts[idIndex];
      }
    }

    console.log("[PUT Distribuição Dias] cronogramaId extraído:", cronogramaId);

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "cronograma_id é obrigatório" },
        { status: 400 },
      );
    }

    const body = await request.json();

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "cronograma_id é obrigatório" },
        { status: 400 },
      );
    }

    if (!body?.dias_semana || !Array.isArray(body.dias_semana)) {
      return NextResponse.json(
        { error: "dias_semana é obrigatório e deve ser um array" },
        { status: 400 },
      );
    }

    const distribuicao = await cronogramaService.atualizarDistribuicaoDias(
      {
        cronograma_id: cronogramaId,
        dias_semana: body.dias_semana,
      },
      request.user.id,
    );

    return NextResponse.json({ success: true, distribuicao }, { status: 200 });
  } catch (error) {
    console.error("[Distribuição Dias PUT] Error:", error);
    return handleError(error);
  }
}

export const GET = requireUserAuth(getHandler);
export const PUT = requireUserAuth(putHandler);
