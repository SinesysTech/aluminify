import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LogoManagerImpl } from "@/brand-customization/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/app/shared/core/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { LogoType } from "@/types/brand-customization";

interface RouteContext {
  params: Promise<{ empresaId: string; logoType: string }>;
}

/**
 * GET /api/tenant-branding/[empresaId]/logos/[logoType] - Get specific logo
 */
async function getHandler(
  request: BrandCustomizationRequest,
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

    // Initialize logo manager
    const logoManager = new LogoManagerImpl(supabase);

    // Get specific logo
    const logo = await logoManager.getLogo(empresaId, logoType as LogoType);

    return NextResponse.json({
      success: true,
      data: logo,
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenant-branding/[empresaId]/logos/[logoType] - Remove specific logo
 * Validates Requirements 7.2, 7.3: Secure file removal
 */
async function deleteHandler(
  request: BrandCustomizationRequest,
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

    // Initialize logo manager
    const logoManager = new LogoManagerImpl(supabase);

    // Remove logo
    await logoManager.removeLogo(empresaId, logoType as LogoType);

    return NextResponse.json({
      success: true,
      message: `${logoType} logo removed successfully`,
    });
  } catch (error) {
    console.error("Error removing logo:", error);
    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 },
    );
  }
}

// Apply access control middleware and export handlers
export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    getHandler(request, context),
);

export const DELETE = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    deleteHandler(request, context),
);
