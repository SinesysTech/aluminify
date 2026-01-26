import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createTransactionRepository } from "@/app/[tenant]/(dashboard)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type {
  TransactionImportResult,
  CreateTransactionInput,
} from "@/app/[tenant]/(dashboard)/financeiro/services/financial.types";
import { isAdminRoleTipo } from "@/app/shared/core/roles";

function handleError(error: unknown) {
  console.error("Transaction Import API Error:", error);

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

interface ImportRow {
  transactionId?: string;
  buyerEmail: string;
  buyerName?: string;
  buyerDocument?: string;
  productName?: string;
  productId?: string;
  amountCents: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  saleDate?: string;
  provider?: string;
}

// POST - Import transactions from JSON payload
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
        { error: "Only admins can import transactions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { error: "Request body must contain 'transactions' array" },
        { status: 400 }
      );
    }

    const rows: ImportRow[] = body.transactions;
    const client = getDatabaseClient();
    const repository = createTransactionRepository(client);

    const result: TransactionImportResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.buyerEmail) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: "Missing required field: buyerEmail",
          });
          continue;
        }

        if (!row.amountCents && row.amountCents !== 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: "Missing required field: amountCents",
          });
          continue;
        }

        // Map payment method
        let paymentMethod: CreateTransactionInput["paymentMethod"] = null;
        if (row.paymentMethod) {
          const methodMap: Record<string, CreateTransactionInput["paymentMethod"]> = {
            credit_card: "credit_card",
            creditcard: "credit_card",
            cartao: "credit_card",
            "cartão": "credit_card",
            "cartão de crédito": "credit_card",
            debit_card: "debit_card",
            debito: "debit_card",
            "débito": "debit_card",
            pix: "pix",
            boleto: "boleto",
            billet: "boleto",
            bank_transfer: "bank_transfer",
            transferencia: "bank_transfer",
            "transferência": "bank_transfer",
          };
          const normalizedMethod = row.paymentMethod.toLowerCase().trim();
          paymentMethod = methodMap[normalizedMethod] ?? "other";
        }

        // Map status
        let status: CreateTransactionInput["status"] = "approved";
        if (row.status) {
          const statusMap: Record<string, CreateTransactionInput["status"]> = {
            approved: "approved",
            aprovado: "approved",
            aprovada: "approved",
            pending: "pending",
            pendente: "pending",
            cancelled: "cancelled",
            cancelado: "cancelled",
            cancelada: "cancelled",
            refunded: "refunded",
            reembolsado: "refunded",
            reembolsada: "refunded",
          };
          const normalizedStatus = row.status.toLowerCase().trim();
          status = statusMap[normalizedStatus] ?? "approved";
        }

        // Build transaction input
        const input: CreateTransactionInput = {
          empresaId: user.empresaId,
          provider: (row.provider as CreateTransactionInput["provider"]) ?? "manual",
          providerTransactionId: row.transactionId ?? null,
          status,
          amountCents: row.amountCents,
          currency: row.currency ?? "BRL",
          paymentMethod,
          buyerEmail: row.buyerEmail,
          buyerName: row.buyerName ?? null,
          buyerDocument: row.buyerDocument ?? null,
          saleDate: row.saleDate ? new Date(row.saleDate) : new Date(),
          confirmationDate: status === "approved" ? new Date() : null,
          productId: row.productId ?? null,
          providerData: {
            importedAt: new Date().toISOString(),
            productName: row.productName,
          },
        };

        // Try to find existing student
        const { data: studentData } = await client
          .from("alunos")
          .select("id")
          .eq("empresa_id", user.empresaId)
          .eq("email", row.buyerEmail)
          .is("deleted_at", null)
          .single();

        if (studentData) {
          input.alunoId = studentData.id;
        }

        // Upsert transaction
        const { created } = await repository.upsertByProviderTransactionId(input);

        if (created) {
          result.created++;
        } else {
          result.updated++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      data: result,
      summary: {
        total: rows.length,
        created: result.created,
        updated: result.updated,
        failed: result.failed,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);
