import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ColorPaletteManagerImpl } from "@/brand-customization/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/backend/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { CreateColorPaletteRequest } from "@/types/brand-customization";

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * POST /api/tenant-branding/[empresaId]/color-palettes/validate - Validate color palette for accessibility
 * Validates Requirements 2.5: Validate color contrast ratios to ensure accessibility compliance
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params: _params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const body = (await request.json()) as CreateColorPaletteRequest;

    // Validate required fields for contrast checking
    const requiredColors = [
      "primaryColor",
      "backgroundColor",
      "secondaryColor",
      "accentColor",
    ];
    for (const colorField of requiredColors) {
      if (!body[colorField as keyof CreateColorPaletteRequest]) {
        return NextResponse.json(
          { error: `${colorField} is required for validation` },
          { status: 400 },
        );
      }
    }

    // Create Supabase client with user authentication
    const authHeader = request.headers.get("authorization");
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // Initialize color palette manager
    const colorPaletteManager = new ColorPaletteManagerImpl(supabase);

    // Validate color contrast
    const accessibilityReport =
      await colorPaletteManager.validateColorContrast(body);

    return NextResponse.json({
      success: true,
      data: accessibilityReport,
    });
  } catch (error) {
    console.error("Error validating color palette:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "ColorValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to validate color palette" },
      { status: 500 },
    );
  }
}

// Apply access control middleware and export handlers
export const POST = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    postHandler(request, context),
);
