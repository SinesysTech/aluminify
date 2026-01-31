import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BrandCustomizationManager } from "@/app/[tenant]/(modules)/settings/personalizacao/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/app/shared/core/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { SaveTenantBrandingRequest } from "@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization.types";

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * GET /api/empresa/personalizacao/[empresaId] - Load tenant branding configuration
 * Validates Requirements 4.2: Load customizations specific to empresa
 */
async function getHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;

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

    // Initialize brand customization manager
    const brandManager = new BrandCustomizationManager(supabase);

    // Load tenant branding configuration
    const result = await brandManager.loadTenantBranding({
      empresaId,
      includeLogos: true,
      includeColorPalette: true,
      includeFontScheme: true,
      includeCustomPresets: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error loading tenant branding:", error);
    return NextResponse.json(
      { error: "Failed to load tenant branding configuration" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/empresa/personalizacao/[empresaId] - Save tenant branding configuration
 * Validates Requirements 5.3, 5.5: Save and manage customizations
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;
    const body = (await request.json()) as SaveTenantBrandingRequest;

    // Validate request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
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

    // Initialize brand customization manager
    const brandManager = new BrandCustomizationManager(supabase);

    // Save tenant branding configuration
    const result = await brandManager.saveTenantBranding({
      empresaId,
      branding: body,
      userId: request.user?.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving tenant branding:", error);
    return NextResponse.json(
      { error: "Failed to save tenant branding configuration" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/empresa/personalizacao/[empresaId] - Reset tenant branding to default
 * Validates Requirements 5.5: Reset functionality
 */
async function deleteHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;

    // Check query parameters for options
    const preserveLogos =
      request.nextUrl.searchParams.get("preserveLogos") === "true";

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

    // Initialize brand customization manager
    const brandManager = new BrandCustomizationManager(supabase);

    // Reset tenant branding to default
    const result = await brandManager.resetToDefault({
      empresaId,
      userId: request.user?.id,
      preserveLogos,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Tenant branding reset to default successfully",
    });
  } catch (error) {
    console.error("Error resetting tenant branding:", error);
    return NextResponse.json(
      { error: "Failed to reset tenant branding to default" },
      { status: 500 },
    );
  }
}

// Apply access control middleware and export handlers
export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    getHandler(request, context),
);

export const POST = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    postHandler(request, context),
);

export const DELETE = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    deleteHandler(request, context),
);
