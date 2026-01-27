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
  HotmartPurchasePayload,
  HotmartSubscriptionCancellationPayload,
  HotmartSwitchPlanPayload,
  HotmartUpdateChargeDatePayload,
  HotmartClubFirstAccessPayload,
  HotmartCartAbandonmentPayload,
  TransactionStatus,
  PaymentMethod,
  HotmartBuyer,
  HotmartAddress,
  HotmartPhone,
} from "./financial.types";

export interface WebhookProcessResult {
  success: boolean;
  transaction?: Transaction;
  message: string;
  studentCreated?: boolean;
  studentEnrolled?: boolean;
}

export interface FinancialService {
  listTransactions(params: TransactionListParams): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: string): Promise<Transaction | null>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  getTransactionStats(empresaId: string, dateFrom?: Date, dateTo?: Date): Promise<TransactionStats>;
  processHotmartWebhook(empresaId: string, payload: HotmartWebhookPayload): Promise<WebhookProcessResult>;
}

// ============================================================================
// Types
// ============================================================================

interface ProductWithCourse {
  id: string;
  curso_id: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapHotmartPaymentMethod(type: string): PaymentMethod {
  const mapping: Record<string, PaymentMethod> = {
    CREDIT_CARD: "credit_card",
    DEBIT_CARD: "debit_card",
    PIX: "pix",
    BILLET: "boleto",
    BANK_TRANSFER: "bank_transfer",
  };
  return mapping[type?.toUpperCase()] ?? "other";
}

function mapPurchaseEventToStatus(event: HotmartEventType): TransactionStatus {
  const mapping: Record<string, TransactionStatus> = {
    PURCHASE_APPROVED: "approved",
    PURCHASE_COMPLETE: "approved",
    PURCHASE_CANCELED: "cancelled",
    PURCHASE_REFUNDED: "refunded",
    PURCHASE_CHARGEBACK: "chargeback",
    PURCHASE_PROTEST: "disputed",
    PURCHASE_DELAYED: "pending",
    PURCHASE_BILLET_PRINTED: "pending",
  };
  return mapping[event] ?? "pending";
}

function isPurchaseEvent(event: HotmartEventType): boolean {
  return event.startsWith("PURCHASE_") && event !== "PURCHASE_OUT_OF_SHOPPING_CART";
}

function isApprovedPurchaseEvent(event: HotmartEventType): boolean {
  return event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE";
}

function isCartAbandonmentEvent(event: HotmartEventType): boolean {
  return event === "PURCHASE_OUT_OF_SHOPPING_CART";
}

function isSubscriptionEvent(event: HotmartEventType): boolean {
  return ["SUBSCRIPTION_CANCELLATION", "SWITCH_PLAN", "UPDATE_SUBSCRIPTION_CHARGE_DATE"].includes(
    event
  );
}

function isClubEvent(event: HotmartEventType): boolean {
  return event === "CLUB_FIRST_ACCESS";
}

function extractPhoneString(phone: HotmartBuyer["phone"]): string | null {
  if (!phone) return null;
  if (typeof phone === "string") return phone;
  const phoneObj = phone as HotmartPhone;
  if (phoneObj.cell) return `${phoneObj.dddCell || ""}${phoneObj.cell}`;
  if (phoneObj.phone) return `${phoneObj.dddPhone || ""}${phoneObj.phone}`;
  return null;
}

function extractAddress(address?: HotmartAddress): HotmartAddress | undefined {
  if (!address) return undefined;
  return {
    city: address.city,
    state: address.state,
    country: address.country,
    neighborhood: address.neighborhood,
    number: address.number,
    complement: address.complement,
    zipcode: address.zipcode,
  };
}

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============================================================================
// Service Implementation
// ============================================================================

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

  async processHotmartWebhook(
    empresaId: string,
    payload: HotmartWebhookPayload
  ): Promise<WebhookProcessResult> {
    const { event } = payload;

    if (isPurchaseEvent(event)) {
      return this.processPurchaseEvent(empresaId, payload as HotmartPurchasePayload);
    }

    if (isCartAbandonmentEvent(event)) {
      return this.processCartAbandonmentEvent(empresaId, payload as HotmartCartAbandonmentPayload);
    }

    if (isSubscriptionEvent(event)) {
      return this.processSubscriptionEvent(empresaId, payload);
    }

    if (isClubEvent(event)) {
      return this.processClubEvent(empresaId, payload as HotmartClubFirstAccessPayload);
    }

    return {
      success: true,
      message: `Event ${event} not processed (unsupported)`,
    };
  }

  // ============================================================================
  // Purchase Events
  // ============================================================================

  private async processPurchaseEvent(
    empresaId: string,
    payload: HotmartPurchasePayload
  ): Promise<WebhookProcessResult> {
    const { data, event, creation_date, id: eventId } = payload;
    const { buyer, purchase, product, offer, subscription, origin } = data;

    if (!purchase?.transaction) {
      return {
        success: true,
        message: `Event ${event} skipped: no transaction data`,
      };
    }

    const status = mapPurchaseEventToStatus(event);
    let studentCreated = false;
    let studentEnrolled = false;
    let studentId: string | null = null;

    // Find product with course info
    const productWithCourse = await this.findProductWithCourse(empresaId, String(product.id));

    // For approved purchases, create student and enroll in course
    if (isApprovedPurchaseEvent(event)) {
      const studentResult = await this.findOrCreateStudent(empresaId, buyer, String(product.id));
      studentId = studentResult.id;
      studentCreated = studentResult.created;

      // Enroll in course if product has a linked course
      if (productWithCourse?.curso_id && studentId) {
        studentEnrolled = await this.enrollStudentInCourse(studentId, productWithCourse.curso_id);
      }
    } else {
      // For non-approved events, just find existing student
      const existingStudent = await this.findStudentByEmail(empresaId, buyer.email);
      if (existingStudent) {
        studentId = existingStudent.id;
      }
    }

    const transactionInput: CreateTransactionInput = {
      empresaId,
      alunoId: studentId,
      productId: productWithCourse?.id ?? null,
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
        ? new Date(purchase.approved_date)
        : new Date(creation_date),
      confirmationDate:
        status === "approved" && purchase.approved_date
          ? new Date(purchase.approved_date)
          : null,
      providerData: {
        hotmart_event_id: eventId,
        hotmart_event_type: event,
        hotmart_product_id: product.id,
        hotmart_product_name: product.name,
        hotmart_product_ucode: product.ucode,
        hotmart_offer_code: offer?.code,
        buyer_phone: extractPhoneString(buyer.phone),
        buyer_address: extractAddress(buyer.address),
        buyer_ip: purchase.buyer_ip,
        subscription: subscription,
        origin: origin,
        order_bump: purchase.order_bump,
        student_created: studentCreated,
        student_enrolled: studentEnrolled,
        curso_id: productWithCourse?.curso_id,
      },
    };

    const { transaction, created } =
      await this.transactionRepository.upsertByProviderTransactionId(transactionInput);

    const messages: string[] = [];
    messages.push(created ? `Transaction created: ${transaction.id}` : `Transaction updated: ${transaction.id}`);
    if (studentCreated) messages.push(`Student created: ${buyer.email}`);
    if (studentEnrolled) messages.push(`Student enrolled in course`);

    console.log("[Hotmart Webhook] Purchase processed:", {
      empresaId,
      event,
      transactionId: transaction.id,
      studentId,
      studentCreated,
      studentEnrolled,
      cursoId: productWithCourse?.curso_id,
    });

    return {
      success: true,
      transaction,
      message: messages.join(". "),
      studentCreated,
      studentEnrolled,
    };
  }

  // ============================================================================
  // Student Management
  // ============================================================================

  private async findOrCreateStudent(
    empresaId: string,
    buyer: HotmartBuyer,
    hotmartProductId: string
  ): Promise<{ id: string; created: boolean }> {
    // Check if student already exists
    const existingStudent = await this.findStudentByEmail(empresaId, buyer.email);
    if (existingStudent) {
      // Update hotmart_id if not set
      if (!existingStudent.hotmart_id) {
        await this.client
          .from("alunos")
          .update({ hotmart_id: hotmartProductId })
          .eq("id", existingStudent.id);
      }
      return { id: existingStudent.id, created: false };
    }

    // Create new student
    const studentId = await this.createStudentFromBuyer(empresaId, buyer, hotmartProductId);
    return { id: studentId, created: true };
  }

  private async createStudentFromBuyer(
    empresaId: string,
    buyer: HotmartBuyer,
    hotmartProductId: string
  ): Promise<string> {
    const temporaryPassword = generateTemporaryPassword();
    const phoneString = extractPhoneString(buyer.phone);
    const address = extractAddress(buyer.address);

    // Create auth user
    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email: buyer.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: buyer.name,
        empresa_id: empresaId,
        role: "aluno",
      },
    });

    if (authError) {
      console.error("[Hotmart Webhook] Failed to create auth user:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Create student record
    const { error: studentError } = await this.client.from("alunos").insert({
      id: userId,
      empresa_id: empresaId,
      email: buyer.email,
      nome_completo: buyer.name,
      cpf: buyer.document ?? null,
      telefone: phoneString,
      cidade: address?.city ?? null,
      estado: address?.state ?? null,
      bairro: address?.neighborhood ?? null,
      pais: address?.country ?? "Brasil",
      numero_endereco: address?.number ?? null,
      complemento: address?.complement ?? null,
      cep: address?.zipcode ?? null,
      hotmart_id: hotmartProductId,
      origem_cadastro: "hotmart",
      must_change_password: true,
      senha_temporaria: temporaryPassword,
    });

    if (studentError) {
      console.error("[Hotmart Webhook] Failed to create student:", studentError);
      // Try to clean up auth user
      await this.client.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create student: ${studentError.message}`);
    }

    // Create profile record
    await this.client.from("profiles").upsert({
      id: userId,
      email: buyer.email,
      full_name: buyer.name,
      empresa_id: empresaId,
      role: "aluno",
    });

    console.log("[Hotmart Webhook] Student created:", {
      id: userId,
      email: buyer.email,
      name: buyer.name,
      empresaId,
    });

    return userId;
  }

  private async enrollStudentInCourse(studentId: string, cursoId: string): Promise<boolean> {
    // Check if already enrolled
    const { data: existing } = await this.client
      .from("alunos_cursos")
      .select("aluno_id")
      .eq("aluno_id", studentId)
      .eq("curso_id", cursoId)
      .single();

    if (existing) {
      console.log("[Hotmart Webhook] Student already enrolled:", { studentId, cursoId });
      return false;
    }

    // Enroll student
    const { error } = await this.client.from("alunos_cursos").insert({
      aluno_id: studentId,
      curso_id: cursoId,
    });

    if (error) {
      console.error("[Hotmart Webhook] Failed to enroll student:", error);
      return false;
    }

    console.log("[Hotmart Webhook] Student enrolled:", { studentId, cursoId });
    return true;
  }

  // ============================================================================
  // Cart Abandonment Event
  // ============================================================================

  private async processCartAbandonmentEvent(
    empresaId: string,
    payload: HotmartCartAbandonmentPayload
  ): Promise<WebhookProcessResult> {
    const { data, id: eventId, creation_date } = payload;
    const { buyer, product, affiliate, checkout_country } = data;

    console.log("[Hotmart Webhook] Cart abandonment:", {
      empresaId,
      eventId,
      product: product.name,
      buyerEmail: buyer?.email,
      affiliate,
      country: checkout_country?.name,
      timestamp: new Date(creation_date).toISOString(),
    });

    return {
      success: true,
      message: `Cart abandonment event logged for product ${product.id}`,
    };
  }

  // ============================================================================
  // Subscription Events
  // ============================================================================

  private async processSubscriptionEvent(
    empresaId: string,
    payload: HotmartWebhookPayload
  ): Promise<WebhookProcessResult> {
    const { event } = payload;

    switch (event) {
      case "SUBSCRIPTION_CANCELLATION":
        return this.processSubscriptionCancellation(
          empresaId,
          payload as HotmartSubscriptionCancellationPayload
        );
      case "SWITCH_PLAN":
        return this.processSwitchPlan(empresaId, payload as HotmartSwitchPlanPayload);
      case "UPDATE_SUBSCRIPTION_CHARGE_DATE":
        return this.processUpdateChargeDate(
          empresaId,
          payload as HotmartUpdateChargeDatePayload
        );
      default:
        return {
          success: true,
          message: `Subscription event ${event} not processed`,
        };
    }
  }

  private async processSubscriptionCancellation(
    empresaId: string,
    payload: HotmartSubscriptionCancellationPayload
  ): Promise<WebhookProcessResult> {
    const { data, id: eventId } = payload;
    const { subscriber, product, subscription, cancellation_date } = data;

    console.log("[Hotmart Webhook] Subscription cancellation:", {
      empresaId,
      eventId,
      subscriberCode: subscriber.code,
      subscriberEmail: subscriber.email,
      product: product.name,
      plan: subscription.plan.name,
      cancellationDate: new Date(cancellation_date).toISOString(),
    });

    return {
      success: true,
      message: `Subscription cancellation processed for ${subscriber.email}`,
    };
  }

  private async processSwitchPlan(
    empresaId: string,
    payload: HotmartSwitchPlanPayload
  ): Promise<WebhookProcessResult> {
    const { data, id: eventId } = payload;
    const { subscription, plans, switch_plan_date } = data;

    const currentPlan = plans.find((p) => p.current);
    const previousPlan = plans.find((p) => !p.current);

    console.log("[Hotmart Webhook] Plan switch:", {
      empresaId,
      eventId,
      subscriberCode: subscription.subscriber_code,
      email: subscription.user.email,
      fromPlan: previousPlan?.name,
      toPlan: currentPlan?.name,
      switchDate: new Date(switch_plan_date).toISOString(),
    });

    return {
      success: true,
      message: `Plan switch processed: ${previousPlan?.name} -> ${currentPlan?.name}`,
    };
  }

  private async processUpdateChargeDate(
    empresaId: string,
    payload: HotmartUpdateChargeDatePayload
  ): Promise<WebhookProcessResult> {
    const { data, id: eventId } = payload;
    const { subscriber, subscription } = data;

    console.log("[Hotmart Webhook] Charge date update:", {
      empresaId,
      eventId,
      subscriberCode: subscriber.code,
      email: subscriber.email,
      oldChargeDay: subscription.old_charge_day,
      newChargeDay: subscription.new_charge_day,
      nextCharge: new Date(subscription.date_next_charge).toISOString(),
    });

    return {
      success: true,
      message: `Charge date updated from day ${subscription.old_charge_day} to ${subscription.new_charge_day}`,
    };
  }

  // ============================================================================
  // Club Events
  // ============================================================================

  private async processClubEvent(
    empresaId: string,
    payload: HotmartClubFirstAccessPayload
  ): Promise<WebhookProcessResult> {
    const { data, id: eventId, creation_date } = payload;
    const { product, user } = data;

    console.log("[Hotmart Webhook] Club first access:", {
      empresaId,
      eventId,
      userEmail: user.email,
      userName: user.name,
      product: product.name,
      accessTime: new Date(creation_date).toISOString(),
    });

    return {
      success: true,
      message: `Club first access recorded for ${user.email} on product ${product.id}`,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async findStudentByEmail(
    empresaId: string,
    email: string
  ): Promise<{ id: string; hotmart_id: string | null } | null> {
    const { data, error } = await this.client
      .from("alunos")
      .select("id, hotmart_id")
      .eq("empresa_id", empresaId)
      .eq("email", email)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return data;
  }

  private async findProductWithCourse(
    empresaId: string,
    hotmartProductId: string
  ): Promise<ProductWithCourse | null> {
    const { data, error } = await this.client
      .from("products")
      .select("id, curso_id")
      .eq("empresa_id", empresaId)
      .eq("provider", "hotmart")
      .eq("provider_product_id", hotmartProductId)
      .single();

    if (error || !data) return null;
    return data;
  }
}

export function createFinancialService(client: SupabaseClient): FinancialService {
  return new FinancialServiceImpl(client);
}
