import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createFinancialService } from "@/app/[tenant]/(modules)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type { UpdateTransactionInput } from "@/app/[tenant]/(modules)/financeiro/services/financial.types";

interface RouteContext {
  params: { id: string };
}

const serializeTransaction = (
  transaction: Awaited<ReturnType<ReturnType<typeof createFinancialService>["getTransaction"]>>
) => {
  if (!transaction) return null;
  return {
    id: transaction.id,
    empresaId: transaction.empresaId,
    alunoId: transaction.alunoId,
    productId: transaction.productId,
    couponId: transaction.couponId,
    provider: transaction.provider,
    providerTransactionId: transaction.providerTransactionId,
    status: transaction.status,
    amountCents: transaction.amountCents,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    installments: transaction.installments,
    buyerEmail: transaction.buyerEmail,
    buyerName: transaction.buyerName,
    buyerDocument: transaction.buyerDocument,
    providerData: transaction.providerData,
    saleDate: transaction.saleDate.toISOString(),
    confirmationDate: transaction.confirmationDate?.toISOString() ?? null,
    refundDate: transaction.refundDate?.toISOString() ?? null,
    refundAmountCents: transaction.refundAmountCents,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
};

function handleError(error: unknown) {
  console.error("Financial API Error:", error);

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

// GET - Get transaction by ID
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
    const financialService = createFinancialService(client);
    const transaction = await financialService.getTransaction(id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify transaction belongs to user's empresa
    if (transaction.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: serializeTransaction(transaction) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH - Update transaction
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
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can update transactions" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;
    const body = await request.json();

    const client = getDatabaseClient();
    const financialService = createFinancialService(client);

    // Verify transaction exists and belongs to user's empresa
    const existing = await financialService.getTransaction(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (existing.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Build update payload
    const updatePayload: UpdateTransactionInput = {};

    if (body.alunoId !== undefined) updatePayload.alunoId = body.alunoId;
    if (body.productId !== undefined) updatePayload.productId = body.productId;
    if (body.couponId !== undefined) updatePayload.couponId = body.couponId;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.amountCents !== undefined) updatePayload.amountCents = body.amountCents;
    if (body.paymentMethod !== undefined) updatePayload.paymentMethod = body.paymentMethod;
    if (body.installments !== undefined) updatePayload.installments = body.installments;
    if (body.buyerName !== undefined) updatePayload.buyerName = body.buyerName;
    if (body.buyerDocument !== undefined) updatePayload.buyerDocument = body.buyerDocument;
    if (body.confirmationDate !== undefined) {
      updatePayload.confirmationDate = body.confirmationDate ? new Date(body.confirmationDate) : null;
    }
    if (body.refundDate !== undefined) {
      updatePayload.refundDate = body.refundDate ? new Date(body.refundDate) : null;
    }
    if (body.refundAmountCents !== undefined) {
      updatePayload.refundAmountCents = body.refundAmountCents;
    }

    // Use repository directly for update
    const { createTransactionRepository } = await import("@/app/[tenant]/(modules)/financeiro/services");
    const repository = createTransactionRepository(client);
    const transaction = await repository.update(id, updatePayload);

    return NextResponse.json({ data: serializeTransaction(transaction) });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const PATCH = requireAuth(patchHandler);
