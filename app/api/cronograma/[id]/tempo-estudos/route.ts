import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import {
  requireUserAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { CronogramaValidationError } from "@/app/[tenant]/(dashboard)/cronograma/services";
import type { Database } from "@/app/shared/core/database.types";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

function handleError(error: unknown) {
  if (error instanceof CronogramaValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("Tempo Estudos API Error:", error);

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

async function putHandler(
  request: AuthenticatedRequest,
  context?: RouteContext | Record<string, unknown>,
) {
  if (!request.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Extrair cronograma_id
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
        cronogramaId = context.id as string;
      }
    }

    if (!cronogramaId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const idIndex = pathParts.indexOf("tempo-estudos") - 1;
      if (idIndex >= 0 && pathParts[idIndex]) {
        cronogramaId = pathParts[idIndex];
      }
    }

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "ID do cronograma é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o cronograma pertence ao usuário
    const client = getDatabaseClient();
    const { data: cronograma, error: cronogramaError } = await client
      .from("cronogramas")
      .select("id, aluno_id")
      .eq("id", cronogramaId)
      .single();

    // Type assertion: Query result properly typed from Database schema
    type CronogramaBasic = Pick<
      Database["public"]["Tables"]["cronogramas"]["Row"],
      "id" | "aluno_id"
    >;
    const typedCronograma = cronograma as CronogramaBasic | null;

    if (cronogramaError || !typedCronograma) {
      return NextResponse.json(
        { error: "Cronograma não encontrado" },
        { status: 404 },
      );
    }

    if (typedCronograma.aluno_id !== request.user.id) {
      return NextResponse.json(
        { error: "Você só pode atualizar seus próprios cronogramas" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { data, disciplina_id, frente_id, tempo_estudos_concluido } = body;

    if (
      !data ||
      !disciplina_id ||
      !frente_id ||
      typeof tempo_estudos_concluido !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: data, disciplina_id, frente_id, tempo_estudos_concluido",
        },
        { status: 400 },
      );
    }

    // Verificar se já existe registro
    const { data: existente } = await client
      .from("cronograma_tempo_estudos")
      .select("id")
      .eq("cronograma_id", cronogramaId)
      .eq("data", data)
      .eq("disciplina_id", disciplina_id)
      .eq("frente_id", frente_id)
      .maybeSingle();

    let resultado;
    if (existente) {
      // Atualizar
      const updateData = {
        tempo_estudos_concluido,
        data_conclusao: tempo_estudos_concluido
          ? new Date().toISOString()
          : null,
      };

      const { data: updated, error: updateError } = await client
        .from("cronograma_tempo_estudos")
        .update(updateData)
        .eq("id", existente.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Tempo Estudos] Erro ao atualizar:", updateError);
        throw new Error(
          `Erro ao atualizar tempo de estudos: ${updateError.message}`,
        );
      }

      resultado = updated;
    } else {
      // Criar
      const insertData = {
        cronograma_id: cronogramaId,
        data,
        disciplina_id,
        frente_id,
        tempo_estudos_concluido,
        data_conclusao: tempo_estudos_concluido
          ? new Date().toISOString()
          : null,
      };

      const { data: created, error: createError } = await client
        .from("cronograma_tempo_estudos")
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error("[Tempo Estudos] Erro ao criar:", createError);
        throw new Error(
          `Erro ao criar registro de tempo de estudos: ${createError.message}`,
        );
      }

      resultado = created;
    }

    return NextResponse.json(
      { success: true, tempo_estudos: resultado },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Tempo Estudos PUT] Error:", error);
    return handleError(error);
  }
}

async function getHandler(
  request: AuthenticatedRequest,
  context?: RouteContext | Record<string, unknown>,
) {
  if (!request.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Extrair cronograma_id
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
        cronogramaId = context.id as string;
      }
    }

    if (!cronogramaId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const idIndex = pathParts.indexOf("tempo-estudos") - 1;
      if (idIndex >= 0 && pathParts[idIndex]) {
        cronogramaId = pathParts[idIndex];
      }
    }

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "ID do cronograma é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o cronograma pertence ao usuário
    const client = getDatabaseClient();
    const { data: cronograma, error: cronogramaError } = await client
      .from("cronogramas")
      .select("id, aluno_id")
      .eq("id", cronogramaId)
      .single();

    // Type assertion: Query result properly typed from Database schema
    type CronogramaBasic = Pick<
      Database["public"]["Tables"]["cronogramas"]["Row"],
      "id" | "aluno_id"
    >;
    const typedCronogramaGet = cronograma as CronogramaBasic | null;

    if (cronogramaError || !typedCronogramaGet) {
      return NextResponse.json(
        { error: "Cronograma não encontrado" },
        { status: 404 },
      );
    }

    if (typedCronogramaGet.aluno_id !== request.user.id) {
      return NextResponse.json(
        { error: "Você só pode acessar seus próprios cronogramas" },
        { status: 403 },
      );
    }

    // Buscar parâmetros de query
    const url = new URL(request.url);
    const data = url.searchParams.get("data");
    const disciplinaId = url.searchParams.get("disciplina_id");
    const frenteId = url.searchParams.get("frente_id");

    let query = client
      .from("cronograma_tempo_estudos")
      .select("*")
      .eq("cronograma_id", cronogramaId);

    if (data) {
      query = query.eq("data", data);
    }
    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }
    if (frenteId) {
      query = query.eq("frente_id", frenteId);
    }

    const { data: tempoEstudos, error: selectError } = await query;

    if (selectError) {
      console.error("[Tempo Estudos] Erro ao buscar:", selectError);
      throw new Error(
        `Erro ao buscar tempo de estudos: ${selectError.message}`,
      );
    }

    return NextResponse.json(
      { success: true, tempo_estudos: tempoEstudos || [] },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Tempo Estudos GET] Error:", error);
    return handleError(error);
  }
}

export const PUT = requireUserAuth(putHandler);
export const GET = requireUserAuth(getHandler);
