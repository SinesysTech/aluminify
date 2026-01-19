import { NextResponse } from "next/server";
import {
  disciplineService,
  DisciplineConflictError,
  DisciplineValidationError,
} from "@/backend/services/discipline";
import { requireAuth, AuthenticatedRequest } from "@/backend/auth/middleware";
import { getDatabaseClientAsUser } from "@/backend/clients/database";

const serializeDiscipline = (
  discipline: Awaited<ReturnType<typeof disciplineService.getById>>,
) => ({
  id: discipline.id,
  name: discipline.name,
  createdAt: discipline.createdAt.toISOString(),
  updatedAt: discipline.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof DisciplineValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof DisciplineConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  // Log detalhado do erro
  console.error("Discipline API Error:", error);

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

// GET requer autenticação para respeitar isolamento de tenant via RLS
async function getHandler(request: AuthenticatedRequest) {
  try {
    const startTime = Date.now();

    // Usar cliente com contexto do usuário para respeitar RLS
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    const client = getDatabaseClientAsUser(token);
    const { data, error } = await client
      .from("disciplinas")
      .select("id, nome, created_at, updated_at")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar disciplinas: ${error.message}`);
    }

    const endTime = Date.now();

    // Log de performance em desenvolvimento
    const duration = endTime - startTime;
    if (process.env.NODE_ENV === "development" && duration > 500) {
      console.warn(`[Discipline API] GET lento: ${duration}ms`);
    }

    const response = NextResponse.json({
      data: (data || []).map((d) => ({
        id: d.id,
        name: d.nome,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
    });

    // Cache privado pois é específico do usuário/tenant
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120",
    );

    return response;
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);

// POST requer autenticação de professor (JWT ou API Key)
async function postHandler(request: AuthenticatedRequest) {
  // API Keys têm acesso total (request.apiKey existe)
  // Se for JWT, verificar se é professor ou superadmin
  console.log("[Discipline POST] Auth check:", {
    hasUser: !!request.user,
    hasApiKey: !!request.apiKey,
    userRole: request.user?.role,
    userIsSuperAdmin: request.user?.isSuperAdmin,
  });

  if (
    request.user &&
    request.user.role !== "professor" &&
    request.user.role !== "superadmin"
  ) {
    console.log("[Discipline POST] Forbidden - user role:", request.user.role);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log("[Discipline POST] Request body:", body);

    if (!body?.name) {
      return NextResponse.json(
        {
          error: "Campo obrigatório: name é necessário",
        },
        { status: 400 },
      );
    }

    const discipline = await disciplineService.create({
      name: body.name,
      empresaId: request.user?.empresaId,
      createdBy: request.user?.id,
    });
    console.log("[Discipline POST] Discipline created:", discipline.id);
    return NextResponse.json(
      { data: serializeDiscipline(discipline) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Discipline POST] Error creating discipline:", error);
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);
