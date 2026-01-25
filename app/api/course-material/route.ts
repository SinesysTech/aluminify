import { NextRequest, NextResponse } from "next/server";
import {
  materialCursoService,
  MaterialCursoValidationError,
  createMaterialCursoService,
} from "@/app/[tenant]/(dashboard)/curso/services/material.service";
import {
  requireAuth,
  requireUserAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import {
  getDatabaseClient,
  getDatabaseClientAsUser,
} from "@/app/shared/core/database/database";

const serializeCourseMaterial = (
  material: Awaited<ReturnType<typeof materialCursoService.getById>>,
) => ({
  id: material.id,
  courseId: material.courseId,
  title: material.title,
  description: material.description,
  type: material.type,
  fileUrl: material.fileUrl,
  order: material.order,
  createdAt: material.createdAt.toISOString(),
  updatedAt: material.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof MaterialCursoValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim() || null;
}

// GET - exige JWT para aplicar RLS (alunos veem apenas materiais de cursos matriculados)
async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClient = getDatabaseClientAsUser(token);
    const userScopedService = createMaterialCursoService(userClient);

    let materials: Awaited<ReturnType<typeof userScopedService.list>>;
    if (courseId) {
      materials = await userScopedService.listByCourse(courseId);
    } else {
      materials = await userScopedService.list();
    }

    return NextResponse.json({ data: materials.map(serializeCourseMaterial) });
  } catch (error) {
    return handleError(error);
  }
}

// POST requer autenticação de professor (JWT ou API Key)
async function postHandler(request: AuthenticatedRequest) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const courseId = body?.courseId as string | undefined;
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId é obrigatório" },
        { status: 400 },
      );
    }
    const token = getBearerToken(request);

    // JWT: usar client user-scoped (RLS faz a validação)
    if (request.user && token) {
      const userClient = getDatabaseClientAsUser(token);
      const userScopedService = createMaterialCursoService(userClient);
      const material = await userScopedService.create({
        courseId,
        title: body?.title,
        description: body?.description,
        type: body?.type,
        fileUrl: body?.fileUrl,
        order: body?.order,
      });
      return NextResponse.json(
        { data: serializeCourseMaterial(material) },
        { status: 201 },
      );
    }

    // API Key: validar tenant manualmente (service role bypassa RLS)
    if (request.apiKey) {
      const db = getDatabaseClient();

      const { data: professor, error: profError } = await db
        .from("professores")
        .select("empresa_id")
        .eq("id", request.apiKey.createdBy)
        .maybeSingle();

      if (profError)
        throw new Error(
          `Falha ao validar professor da API key: ${profError.message}`,
        );

      const empresaId =
        (professor as { empresa_id?: string | null } | null)?.empresa_id ??
        null;
      if (!empresaId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: courseOk, error: courseErr } = await db
        .from("cursos")
        .select("id")
        .eq("id", courseId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (courseErr)
        throw new Error(`Falha ao validar curso: ${courseErr.message}`);
      if (!courseOk) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Aqui é seguro usar o service role (empresa_id será derivado do curso no repositório + FK composta)
      const material = await materialCursoService.create({
        courseId,
        title: body?.title,
        description: body?.description,
        type: body?.type,
        fileUrl: body?.fileUrl,
        order: body?.order,
      });
      return NextResponse.json(
        { data: serializeCourseMaterial(material) },
        { status: 201 },
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireUserAuth(getHandler);
export const POST = requireAuth(postHandler);
