import { NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/app/shared/core/api-client";
import { PlantaoQuotaService } from "@/app/[tenant]/(modules)/agendamentos/services/plantao-quota.service";

/**
 * GET /api/agendamentos/quota
 * Returns the authenticated student's plantao quota info
 */
export async function GET() {
  try {
    const supabase = await createAuthenticatedClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get student's empresa_id
    const { data: userData, error: dataError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (dataError || !userData?.empresa_id) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou sem empresa" },
        { status: 404 }
      );
    }

    const service = new PlantaoQuotaService(supabase);
    const quotaInfo = await service.getStudentQuotaInfo(user.id, userData.empresa_id);

    return NextResponse.json({
      success: true,
      totalQuota: quotaInfo.totalQuota,
      usedThisMonth: quotaInfo.usedThisMonth,
      remaining: quotaInfo.remaining,
      hasQuotaConfigured: quotaInfo.hasQuotaConfigured,
    });
  } catch (error) {
    console.error("Error fetching student quota:", error);
    return NextResponse.json(
      { error: "Failed to fetch quota information" },
      { status: 500 }
    );
  }
}
