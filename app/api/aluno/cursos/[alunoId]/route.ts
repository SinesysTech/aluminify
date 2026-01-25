import { NextResponse, type NextRequest } from "next/server";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

function handleError(error: unknown) {
  console.error("Aluno Cursos API Error:", error);
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
  params: Promise<{ alunoId: string }>;
}

async function getHandler(
  request: AuthenticatedRequest,
  params: { alunoId: string },
) {
  try {
    const alunoId = params.alunoId;

    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId is required" },
        { status: 400 },
      );
    }

    // Permissão: aluno só pode ver seus próprios cursos
    if (
      request.user &&
      request.user.role !== "usuario" &&
      request.user.role !== "superadmin"
    ) {
      if (request.user.id !== alunoId) {
        return NextResponse.json(
          { error: "Forbidden: You can only access your own courses" },
          { status: 403 },
        );
      }
    }

    // Não usamos RLS aqui; o backend já validou o JWT e faz a checagem de permissão acima.
    const { getDatabaseClient } = await import("@/backend/clients/database");
    const client = getDatabaseClient();

    const { data, error } = await client
      .from("alunos_cursos")
      .select("curso_id, cursos(id, nome)")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar cursos do aluno: ${error.message}`);
    }

    const cursos = (data || [])
      .map(
        (row: {
          cursos:
            | { id: string; nome: string }
            | { id: string; nome: string }[]
            | null;
        }) => {
          const c = row.cursos;
          if (!c) return null;
          if (Array.isArray(c)) return c[0] ?? null;
          return c;
        },
      )
      .filter((c): c is { id: string; nome: string } => Boolean(c));

    // Deduplicar por id
    const unique = Array.from(
      new Map(cursos.map((c) => [c.id, c])).values(),
    ).sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({ data: unique });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => getHandler(req, params))(request);
}
