import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createCouponRepository, type CouponListParams } from "@/app/[tenant]/(modules)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";

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
  console.error("Coupons API Error:", error);

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

// GET - List coupons with filters
async function getHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const params: CouponListParams = {
      empresaId: user.empresaId,
    };

    // Pagination
    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        params.page = pageNum;
      }
    }

    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      const pageSizeNum = parseInt(pageSize, 10);
      if (!isNaN(pageSizeNum) && pageSizeNum > 0) {
        params.pageSize = pageSizeNum;
      }
    }

    // Filters
    const active = searchParams.get("active");
    if (active === "true") {
      params.active = true;
    } else if (active === "false") {
      params.active = false;
    }

    // Sorting
    const sortBy = searchParams.get("sortBy") as "code" | "created_at" | "valid_until" | null;
    if (sortBy) {
      params.sortBy = sortBy;
    }

    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }

    const client = getDatabaseClient();
    const repository = createCouponRepository(client);
    const result = await repository.list(params);

    return NextResponse.json({
      data: result.data.map(serializeCoupon),
      meta: result.meta,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create coupon
async function postHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create coupons" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.code) {
      return NextResponse.json(
        { error: "Missing required field: code" },
        { status: 400 }
      );
    }

    if (body.discountValue === undefined || body.discountValue === null) {
      return NextResponse.json(
        { error: "Missing required field: discountValue" },
        { status: 400 }
      );
    }

    const client = getDatabaseClient();
    const repository = createCouponRepository(client);

    // Check if code already exists
    const existing = await repository.findByCode(user.empresaId, body.code);
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const coupon = await repository.create({
      empresaId: user.empresaId,
      code: body.code,
      description: body.description ?? null,
      discountType: body.discountType ?? "percentage",
      discountValue: body.discountValue,
      maxUses: body.maxUses ?? null,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      active: body.active ?? true,
    });

    return NextResponse.json(
      { data: serializeCoupon(coupon) },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
