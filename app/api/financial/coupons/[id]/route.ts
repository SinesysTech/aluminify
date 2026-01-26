import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createCouponRepository } from "@/app/[tenant]/(dashboard)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type { UpdateCouponInput } from "@/app/[tenant]/(dashboard)/financeiro/services/financial.types";
import { isAdminRoleTipo } from "@/app/shared/core/roles";

interface RouteContext {
  params: { id: string };
}

const serializeCoupon = (
  coupon: Awaited<ReturnType<ReturnType<typeof createCouponRepository>["findById"]>>
) => {
  if (!coupon) return null;
  return {
    id: coupon.id,
    empresaId: coupon.empresaId,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxUses: coupon.maxUses,
    currentUses: coupon.currentUses,
    validFrom: coupon.validFrom.toISOString(),
    validUntil: coupon.validUntil?.toISOString() ?? null,
    active: coupon.active,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
};

function handleError(error: unknown) {
  console.error("Coupon API Error:", error);

  let errorMessage = "Internal server error";
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}

// GET - Get coupon by ID
async function getHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;

    const client = getDatabaseClient();
    const repository = createCouponRepository(client);
    const coupon = await repository.findById(id);

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    // Verify coupon belongs to user's empresa
    if (coupon.empresaId !== user.empresaId && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: serializeCoupon(coupon) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH - Update coupon
async function patchHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    // Check if user is admin
    const isAdmin = user.role === "usuario" && !!user.roleType && isAdminRoleTipo(user.roleType);
    if (!user.isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can update coupons" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;
    const body = await request.json();

    const client = getDatabaseClient();
    const repository = createCouponRepository(client);

    // Verify coupon exists and belongs to user's empresa
    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (existing.empresaId !== user.empresaId && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check for duplicates
    if (body.code && body.code.toUpperCase() !== existing.code) {
      const duplicate = await repository.findByCode(user.empresaId, body.code);
      if (duplicate) {
        return NextResponse.json(
          { error: "A coupon with this code already exists" },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updatePayload: UpdateCouponInput = {};

    if (body.code !== undefined) updatePayload.code = body.code;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.discountType !== undefined) updatePayload.discountType = body.discountType;
    if (body.discountValue !== undefined) updatePayload.discountValue = body.discountValue;
    if (body.maxUses !== undefined) updatePayload.maxUses = body.maxUses;
    if (body.validFrom !== undefined) updatePayload.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) {
      updatePayload.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    }
    if (body.active !== undefined) updatePayload.active = body.active;

    const coupon = await repository.update(id, updatePayload);

    return NextResponse.json({ data: serializeCoupon(coupon) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Delete coupon
async function deleteHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    // Check if user is admin
    const isAdmin = user.role === "usuario" && !!user.roleType && isAdminRoleTipo(user.roleType);
    if (!user.isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can delete coupons" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;

    const client = getDatabaseClient();
    const repository = createCouponRepository(client);

    // Verify coupon exists and belongs to user's empresa
    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (existing.empresaId !== user.empresaId && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    await repository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const PATCH = requireAuth(patchHandler);
export const DELETE = requireAuth(deleteHandler);
