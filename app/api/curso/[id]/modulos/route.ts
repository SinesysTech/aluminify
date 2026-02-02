import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/app/shared/core/api-client";
import { CursoModulosService } from "@/app/[tenant]/(modules)/curso/services/curso-modulos.service";
import { ModuleVisibilityService } from "@/app/[tenant]/(modules)/empresa/services/module-visibility.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/curso/[id]/modulos
 * Returns module IDs bound to this course.
 * With ?full=true, also returns tenant-visible modules and empresaId for admin UI.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: cursoId } = await params;
    const isFull = request.nextUrl.searchParams.get("full") === "true";
    const supabase = await createAuthenticatedClient();

    const service = new CursoModulosService(supabase);
    const moduleIds = await service.getModulesForCourse(cursoId);

    if (!isFull) {
      return NextResponse.json({ success: true, moduleIds });
    }

    // Full mode: include tenant-visible modules and empresaId for admin UI
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("empresa_id")
      .eq("id", cursoId)
      .single();

    if (cursoError || !curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 },
      );
    }

    const visibilityService = new ModuleVisibilityService(supabase);
    const tenantModules = await visibilityService.getVisibleModules(
      curso.empresa_id,
    );

    return NextResponse.json({
      success: true,
      moduleIds,
      tenantModules,
      empresaId: curso.empresa_id,
    });
  } catch (error) {
    console.error("Error fetching course modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch course modules" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/curso/[id]/modulos
 * Sets module IDs for this course (replaces all)
 * Body: { moduleIds: string[], empresaId: string }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: cursoId } = await params;
    const body = await request.json();

    if (!body || !Array.isArray(body.moduleIds) || !body.empresaId) {
      return NextResponse.json(
        { error: "Request must include 'moduleIds' array and 'empresaId'" },
        { status: 400 },
      );
    }

    const supabase = await createAuthenticatedClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check admin permissions
    const visibilityService = new ModuleVisibilityService(supabase);
    const isAdmin = await visibilityService.isEmpresaAdmin(
      user.id,
      body.empresaId,
    );
    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem configurar módulos do curso.",
        },
        { status: 403 },
      );
    }

    const service = new CursoModulosService(supabase);
    await service.setModulesForCourse(
      cursoId,
      body.empresaId,
      body.moduleIds,
      user.id,
    );

    const updatedModuleIds = await service.getModulesForCourse(cursoId);
    return NextResponse.json({ success: true, moduleIds: updatedModuleIds });
  } catch (error) {
    console.error("Error updating course modules:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update course modules";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
