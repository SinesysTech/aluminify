import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BrandCustomizationManager } from "@/brand-customization/services";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";

/**
 * GET /api/tenant-branding/[empresaId]/public - Load public tenant branding
 * Allows unauthenticated access for login/signup pages
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;

    // Create Supabase client (no auth needed for public config, but we need anon key)
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Initialize brand customization manager
    const brandManager = new BrandCustomizationManager(supabase);

    // Load tenant branding configuration
    const result = await brandManager.loadTenantBranding({
      empresaId,
      includeLogos: true,
      includeColorPalette: true,
      includeFontScheme: true,
      includeCustomPresets: false, // Don't need presets for public view
    });

    if (!result.success) {
      // If it fails (e.g. invalid ID), return 404 or default
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error loading public tenant branding:", error);
    return NextResponse.json(
      { error: "Failed to load tenant branding configuration" },
      { status: 500 },
    );
  }
}
