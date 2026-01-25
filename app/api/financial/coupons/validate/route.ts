import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import { CouponRepositoryImpl } from "@/backend/services/financial";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";

function handleError(error: unknown) {
  console.error("Coupon Validate API Error:", error);

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

// POST - Validate a coupon code
async function postHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { error: "Missing required field: code" },
        { status: 400 }
      );
    }

    const client = getDatabaseClient();
    const repository = new CouponRepositoryImpl(client);

    const result = await repository.validateCoupon(user.empresaId, body.code);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
      });
    }

    const coupon = result.coupon!;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);
