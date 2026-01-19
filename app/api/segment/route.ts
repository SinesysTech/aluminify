import { NextResponse } from "next/server";
import {
  segmentService,
  SegmentConflictError,
  SegmentValidationError,
} from "@/backend/services/segment";
import { requireAuth, AuthenticatedRequest } from "@/backend/auth/middleware";
import { getDatabaseClientAsUser } from "@/backend/clients/database";

const serializeSegment = (
  segment: Awaited<ReturnType<typeof segmentService.getById>>,
) => ({
  id: segment.id,
  name: segment.name,
  slug: segment.slug,
  createdAt: segment.createdAt.toISOString(),
  updatedAt: segment.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof SegmentValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof SegmentConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  // Log detalhado do erro
  console.error("Segment API Error:", error);

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
    // Usar cliente com contexto do usuário para respeitar RLS
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    const client = getDatabaseClientAsUser(token);
    const { data, error } = await client
      .from("segmentos")
      .select("id, nome, slug, created_at, updated_at")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar segmentos: ${error.message}`);
    }

    const response = NextResponse.json({
      data: (data || []).map((s) => ({
        id: s.id,
        name: s.nome,
        slug: s.slug,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
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
  console.log("[Segment POST] Auth check:", {
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
    console.log("[Segment POST] Forbidden - user role:", request.user.role);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log("[Segment POST] Request body:", body);

    if (!body?.name || !body?.slug) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: name e slug são necessários",
        },
        { status: 400 },
      );
    }

    const segment = await segmentService.create({
      name: body.name,
      slug: body.slug,
      empresaId: request.user?.empresaId,
      createdBy: request.user?.id,
    });
    console.log("[Segment POST] Segment created:", segment.id);
    return NextResponse.json(
      { data: serializeSegment(segment) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Segment POST] Error creating segment:", error);
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);
