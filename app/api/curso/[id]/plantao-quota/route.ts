import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/app/shared/core/api-client";
import { PlantaoQuotaService } from "@/app/[tenant]/(modules)/agendamentos/services/plantao-quota.service";
import { ModuleVisibilityService } from "@/app/[tenant]/(modules)/empresa/services/module-visibility.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/curso/[id]/plantao-quota
 * Returns the plantao quota for a course
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: cursoId } = await params;
    const supabase = await createAuthenticatedClient();

    const service = new PlantaoQuotaService(supabase);
    const quotaMensal = await service.getQuotaForCourse(cursoId);

    // Include empresaId for admin UI convenience
    const { data: curso } = await supabase
      .from("cursos")
      .select("empresa_id")
      .eq("id", cursoId)
      .single();

    return NextResponse.json({
      success: true,
      quotaMensal,
      empresaId: curso?.empresa_id ?? null,
    });
  } catch (error) {
    console.error("Error fetching plantao quota:", error);
    return NextResponse.json(
      { error: "Failed to fetch plantao quota" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/curso/[id]/plantao-quota
 * Sets the plantao quota for a course
 * Body: { quotaMensal: number, empresaId: string }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: cursoId } = await params;
    const body = await request.json();

    if (!body || typeof body.quotaMensal !== "number" || !body.empresaId) {
      return NextResponse.json(
        {
          error: "Request must include 'quotaMensal' (number) and 'empresaId'",
        },
        { status: 400 },
      );
    }

    if (body.quotaMensal < 0) {
      return NextResponse.json(
        { error: "quotaMensal deve ser >= 0" },
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
            "Acesso negado. Apenas administradores podem configurar cotas de plantão.",
        },
        { status: 403 },
      );
    }

    const service = new PlantaoQuotaService(supabase);
    await service.setQuotaForCourse(
      cursoId,
      body.empresaId,
      body.quotaMensal,
      user.id,
    );

    return NextResponse.json({ success: true, quotaMensal: body.quotaMensal });
  } catch (error) {
    console.error("Error updating plantao quota:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update plantao quota";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
