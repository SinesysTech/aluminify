import { NextRequest, NextResponse } from "next/server";
import { ModuleVisibilityService } from "@/app/[tenant]/(modules)/empresa/services/module-visibility.service";
import type { BulkUpdateModuleVisibilityInput } from "@/app/[tenant]/(modules)/empresa/services/module-visibility.types";
import { createAuthenticatedClient } from "@/app/shared/core/api-client";

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * GET /api/empresa/module-visibility/[empresaId]
 * Returns visible modules for a tenant (used by sidebar)
 *
 * Query params:
 * - config=true: Returns full config with all modules for admin UI
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { empresaId } = await params;
    const isConfigMode = request.nextUrl.searchParams.get("config") === "true";

    const supabase = await createAuthenticatedClient();
    const service = new ModuleVisibilityService(supabase);

    if (isConfigMode) {
      // Return full configuration for admin UI
      const config = await service.getModuleVisibilityConfig(empresaId);
      return NextResponse.json({
        success: true,
        data: config,
      });
    }

    // Check if the caller is a student - if so, filter modules by enrolled courses
    const { data: { user } } = await supabase.auth.getUser();
    let modules: Awaited<ReturnType<typeof service.getVisibleModules>>;

    if (user) {
      // Check if user is a student in this empresa
      const { data: userEmpresa } = await supabase
        .from("usuarios_empresas")
        .select("papel_base")
        .eq("usuario_id", user.id)
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .maybeSingle();

      if (userEmpresa?.papel_base === "aluno") {
        // Student: filter modules by enrolled courses
        modules = await service.getVisibleModulesForStudent(empresaId, user.id);
      } else {
        // Non-student: return all tenant-visible modules
        modules = await service.getVisibleModules(empresaId);
      }
    } else {
      modules = await service.getVisibleModules(empresaId);
    }

    return NextResponse.json({
      success: true,
      modules,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const details = error instanceof Error ? error.stack : String(error);
    console.error("Error fetching module visibility:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch module visibility",
        ...(process.env.NODE_ENV === "development" && { message, details }),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/empresa/module-visibility/[empresaId]
 * Updates module visibility configuration for a tenant
 * Only empresa admins can update
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { empresaId } = await params;
    const body = (await request.json()) as BulkUpdateModuleVisibilityInput;

    // Validate request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.modules) || !Array.isArray(body.submodules)) {
      return NextResponse.json(
        { error: "Request must include 'modules' and 'submodules' arrays" },
        { status: 400 },
      );
    }

    const supabase = await createAuthenticatedClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const service = new ModuleVisibilityService(supabase);

    // Check if user is admin
    const isAdmin = await service.isEmpresaAdmin(user.id, empresaId);
    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem configurar módulos.",
        },
        { status: 403 },
      );
    }

    // Update visibility
    await service.bulkUpdateVisibility(empresaId, body, user.id);

    // Return updated config
    const modules = await service.getVisibleModules(empresaId);
    return NextResponse.json({
      success: true,
      modules,
    });
  } catch (error) {
    console.error("Error updating module visibility:", error);

    // Check if it's a validation error (core module)
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update module visibility";

    if (errorMessage.includes("essencial")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/empresa/module-visibility/[empresaId]
 * Resets module visibility to defaults for a tenant
 * Only empresa admins can reset
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { empresaId } = await params;

    const supabase = await createAuthenticatedClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const service = new ModuleVisibilityService(supabase);

    // Check if user is admin
    const isAdmin = await service.isEmpresaAdmin(user.id, empresaId);
    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem resetar configurações.",
        },
        { status: 403 },
      );
    }

    // Reset to defaults
    await service.resetToDefaults(empresaId);

    // Return updated (default) modules
    const modules = await service.getVisibleModules(empresaId);
    return NextResponse.json({
      success: true,
      modules,
      message: "Configuração de módulos resetada para o padrão",
    });
  } catch (error) {
    console.error("Error resetting module visibility:", error);
    return NextResponse.json(
      { error: "Failed to reset module visibility" },
      { status: 500 },
    );
  }
}
