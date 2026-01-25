import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import { createFinancialService } from "@/backend/services/financial";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";

function handleError(error: unknown) {
  console.error("Financial Stats API Error:", error);

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

// GET - Get transaction statistics
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

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    const dateFromParam = searchParams.get("dateFrom");
    if (dateFromParam) {
      dateFrom = new Date(dateFromParam);
    }

    const dateToParam = searchParams.get("dateTo");
    if (dateToParam) {
      dateTo = new Date(dateToParam);
    }

    const client = getDatabaseClient();
    const financialService = createFinancialService(client);

    const stats = await financialService.getTransactionStats(
      user.empresaId,
      dateFrom,
      dateTo
    );

    return NextResponse.json({
      data: {
        totalAmountCents: stats.totalAmountCents,
        totalAmount: stats.totalAmountCents / 100,
        transactionCount: stats.transactionCount,
        averageTicketCents: stats.averageTicketCents,
        averageTicket: stats.averageTicketCents / 100,
        byStatus: stats.byStatus,
        byPaymentMethod: stats.byPaymentMethod,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
