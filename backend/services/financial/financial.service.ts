import { SupabaseClient } from "@supabase/supabase-js";
import {
  TransactionRepositoryImpl,
  type PaginatedResult,
} from "./transaction.repository";
import type {
  Transaction,
  CreateTransactionInput,
  TransactionStats,
  TransactionListParams,
  HotmartWebhookPayload,
  HotmartEventType,
  TransactionStatus,
  PaymentMethod,
} from "./financial.types";

export interface FinancialService {
  // Transaction operations
  listTransactions(params: TransactionListParams): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: string): Promise<Transaction | null>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  getTransactionStats(empresaId: string, dateFrom?: Date, dateTo?: Date): Promise<TransactionStats>;

  // Hotmart webhook handling
  processHotmartWebhook(
    empresaId: string,
    payload: HotmartWebhookPayload,
    webhookSecret: string
  ): Promise<{ success: boolean; transaction?: Transaction; message: string }>;
}

/**
 * Map Hotmart payment type to our PaymentMethod enum
 */
function mapHotmartPaymentMethod(type: string): PaymentMethod | null {
  const mapping: Record<string, PaymentMethod> = {
    CREDIT_CARD: "credit_card",
    DEBIT_CARD: "debit_card",
    PIX: "pix",
    BILLET: "boleto",
    BANK_TRANSFER: "bank_transfer",
  };
  return mapping[type?.toUpperCase()] ?? "other";
}

/**
 * Map Hotmart status to our TransactionStatus enum
 */
function mapHotmartEventToStatus(event: HotmartEventType): TransactionStatus {
  const mapping: Record<HotmartEventType, TransactionStatus> = {
    PURCHASE_APPROVED: "approved",
    PURCHASE_COMPLETE: "approved",
    PURCHASE_CANCELED: "cancelled",
    PURCHASE_REFUNDED: "refunded",
    PURCHASE_CHARGEBACK: "chargeback",
    PURCHASE_PROTEST: "disputed",
    PURCHASE_DELAYED: "pending",
  };
  return mapping[event] ?? "pending";
}

export class FinancialServiceImpl implements FinancialService {
  private transactionRepository: TransactionRepositoryImpl;

  constructor(private readonly client: SupabaseClient) {
    this.transactionRepository = new TransactionRepositoryImpl(client);
  }

  async listTransactions(params: TransactionListParams): Promise<PaginatedResult<Transaction>> {
    return this.transactionRepository.list(params);
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findById(id);
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    return this.transactionRepository.create(input);
  }

  async getTransactionStats(
    empresaId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TransactionStats> {
    return this.transactionRepository.getStats(empresaId, dateFrom, dateTo);
  }

  /**
   * Process a Hotmart webhook event
   * Returns the processed transaction or error message
   */
  async processHotmartWebhook(
    empresaId: string,
    payload: HotmartWebhookPayload,
    webhookSecret: string
  ): Promise<{ success: boolean; transaction?: Transaction; message: string }> {
    // Validate webhook signature (hottok)
    if (payload.hottok !== webhookSecret) {
      return {
        success: false,
        message: "Invalid webhook signature",
      };
    }

    const { data, event } = payload;
    const status = mapHotmartEventToStatus(event);

    // Skip unsupported events (return success to prevent retries)
    if (!data?.purchase?.transaction) {
      return {
        success: true,
        message: `Event ${event} skipped: no transaction data`,
      };
    }

    // Extract buyer info
    const buyer = data.buyer;
    const purchase = data.purchase;
    const product = data.product;

    // Build transaction input
    const transactionInput: CreateTransactionInput = {
      empresaId,
      provider: "hotmart",
      providerTransactionId: purchase.transaction,
      status,
      amountCents: Math.round(purchase.price.value * 100),
      currency: purchase.price.currency_code || "BRL",
      paymentMethod: mapHotmartPaymentMethod(purchase.payment.type),
      installments: purchase.payment.installments_number ?? 1,
      buyerEmail: buyer.email,
      buyerName: buyer.name,
      buyerDocument: buyer.document ?? null,
      saleDate: purchase.approved_date
        ? new Date(purchase.approved_date * 1000)
        : new Date(payload.creation_date * 1000),
      confirmationDate:
        status === "approved" && purchase.approved_date
          ? new Date(purchase.approved_date * 1000)
          : null,
      providerData: {
        hotmart_product_id: product.id,
        hotmart_product_name: product.name,
        hotmart_product_ucode: product.ucode,
        hotmart_offer_code: data.offer?.code,
        buyer_address: buyer.address,
        buyer_phone: buyer.phone,
        subscription: data.subscription,
        original_event: event,
      },
    };

    // Try to find and link to existing student
    const studentLink = await this.findStudentByEmail(empresaId, buyer.email);
    if (studentLink) {
      transactionInput.alunoId = studentLink.id;
    }

    // Try to find and link to existing product
    const productLink = await this.findProductByHotmartId(
      empresaId,
      String(product.id)
    );
    if (productLink) {
      transactionInput.productId = productLink.id;
    }

    // Upsert transaction (idempotent)
    const { transaction, created } = await this.transactionRepository.upsertByProviderTransactionId(
      transactionInput
    );

    return {
      success: true,
      transaction,
      message: created
        ? `Transaction created: ${transaction.id}`
        : `Transaction updated: ${transaction.id}`,
    };
  }

  /**
   * Find a student by email within the empresa
   */
  private async findStudentByEmail(
    empresaId: string,
    email: string
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.client
      .from("alunos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("email", email)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Find a product by Hotmart product ID within the empresa
   */
  private async findProductByHotmartId(
    empresaId: string,
    hotmartProductId: string
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.client
      .from("products")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("provider", "hotmart")
      .eq("provider_product_id", hotmartProductId)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Create a student from Hotmart buyer data if not exists
   * Returns the student ID
   */
  async createStudentFromHotmartBuyer(
    empresaId: string,
    buyerEmail: string,
    buyerName: string,
    buyerData: HotmartWebhookPayload["data"]["buyer"]
  ): Promise<string> {
    // Check if student exists
    const existing = await this.findStudentByEmail(empresaId, buyerEmail);
    if (existing) return existing.id;

    // Create auth user first
    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email: buyerEmail,
      email_confirm: true,
      user_metadata: {
        full_name: buyerName,
        empresa_id: empresaId,
        role: "aluno",
      },
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create student record
    const { data: studentData, error: studentError } = await this.client
      .from("alunos")
      .insert({
        id: authData.user.id,
        empresa_id: empresaId,
        email: buyerEmail,
        nome_completo: buyerName,
        cpf: buyerData.document ?? null,
        telefone: buyerData.phone ?? null,
        cidade: buyerData.address?.city ?? null,
        estado: buyerData.address?.state ?? null,
        bairro: buyerData.address?.neighborhood ?? null,
        pais: buyerData.address?.country ?? "Brasil",
        numero_endereco: buyerData.address?.number ?? null,
        complemento: buyerData.address?.complement ?? null,
        cep: buyerData.address?.zipcode ?? null,
        origem_cadastro: "hotmart",
        must_change_password: true,
      })
      .select("id")
      .single();

    if (studentError) {
      throw new Error(`Failed to create student: ${studentError.message}`);
    }

    return studentData.id;
  }
}

/**
 * Factory function to create a FinancialService instance
 */
export function createFinancialService(client: SupabaseClient): FinancialService {
  return new FinancialServiceImpl(client);
}
