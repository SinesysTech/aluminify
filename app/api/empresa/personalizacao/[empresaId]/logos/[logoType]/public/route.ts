import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LogoManagerImpl } from "@/app/[tenant]/(modules)/settings/personalizacao/services";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { LogoType } from "@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization.types";

/**
 * GET /api/empresa/personalizacao/[empresaId]/logos/[logoType]/public
 * Public endpoint to get a specific logo (no authentication required)
 * Used by TenantLogo component in both authenticated and unauthenticated contexts
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ empresaId: string; logoType: string }> },
) {
  try {
    const { empresaId, logoType } = await params;

    // Validate logoType
    if (!["login", "sidebar", "favicon"].includes(logoType)) {
      return NextResponse.json(
        { error: "Invalid logoType. Must be one of: login, sidebar, favicon" },
        { status: 400 },
      );
    }

    // Create Supabase client (no auth needed for public logo access)
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Initialize logo manager
    const logoManager = new LogoManagerImpl(supabase);

    // Get specific logo
    const logo = await logoManager.getLogo(empresaId, logoType as LogoType);

    return NextResponse.json({
      success: true,
      data: logo,
    });
  } catch (error) {
    console.error("Error fetching public logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 },
    );
  }
}
