import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import { createFinancialService } from "@/app/[tenant]/(dashboard)/admin/services/financial";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type {
  TransactionListParams,
  TransactionStatus,
  Provider,
} from "@/app/[tenant]/(dashboard)/admin/services/financial/financial.types";
import { isAdminRoleTipo } from "@/app/shared/core/roles";

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
    console.error("Error stack:", error.stack);
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message);
  }

  return NextResponse.json(
    {
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    },
    { status: 500 }
  );
}

// GET - List transactions with filters
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

    const params: TransactionListParams = {
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
    const status = searchParams.get("status") as TransactionStatus | null;
    if (status) {
      params.status = status;
    }

    const provider = searchParams.get("provider") as Provider | null;
    if (provider) {
      params.provider = provider;
    }

    const productId = searchParams.get("productId");
    if (productId) {
      params.productId = productId;
    }

    const alunoId = searchParams.get("alunoId");
    if (alunoId) {
      params.alunoId = alunoId;
    }

    const buyerEmail = searchParams.get("buyerEmail");
    if (buyerEmail) {
      params.buyerEmail = buyerEmail;
    }

    const dateFrom = searchParams.get("dateFrom");
    if (dateFrom) {
      params.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get("dateTo");
    if (dateTo) {
      params.dateTo = new Date(dateTo);
    }

    // Sorting
    const sortBy = searchParams.get("sortBy") as "sale_date" | "amount_cents" | "created_at" | null;
    if (sortBy) {
      params.sortBy = sortBy;
    }

    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }

    const client = getDatabaseClient();
    const financialService = createFinancialService(client);
    const result = await financialService.listTransactions(params);

    return NextResponse.json({
      data: result.data.map(serializeTransaction),
      meta: result.meta,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create manual transaction
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
    const isAdmin = user.role === "usuario" && !!user.roleType && isAdminRoleTipo(user.roleType);
    if (!user.isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create transactions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const client = getDatabaseClient();
    const financialService = createFinancialService(client);

    const transaction = await financialService.createTransaction({
      empresaId: user.empresaId,
      alunoId: body.alunoId ?? null,
      productId: body.productId ?? null,
      couponId: body.couponId ?? null,
      provider: body.provider ?? "manual",
      providerTransactionId: body.providerTransactionId ?? null,
      status: body.status ?? "approved",
      amountCents: body.amountCents,
      currency: body.currency ?? "BRL",
      paymentMethod: body.paymentMethod ?? null,
      installments: body.installments ?? 1,
      buyerEmail: body.buyerEmail,
      buyerName: body.buyerName ?? null,
      buyerDocument: body.buyerDocument ?? null,
      providerData: body.providerData ?? {},
      saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
      confirmationDate: body.confirmationDate ? new Date(body.confirmationDate) : null,
    });

    return NextResponse.json(
      { data: serializeTransaction(transaction) },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
