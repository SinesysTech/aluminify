/**
 * Script para importar transações da Hotmart para o sistema Aluminify
 *
 * Uso: npx tsx scripts/import-hotmart-transactions.ts
 *      npx tsx scripts/import-hotmart-transactions.ts --dry-run
 *
 * Requisitos:
 * - Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY configuradas
 * - Arquivo hotmart-transactions-import.json gerado pelo script Python
 * - Alunos já importados no sistema
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Configuração
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7"; // Jana Rabelo
const PROVIDER = "hotmart";
const DRY_RUN = process.argv.includes("--dry-run");

interface HotmartTransaction {
  buyerEmail: string;
  buyerName: string | null;
  buyerDocument: string | null;
  providerTransactionId: string;
  productName: string;
  productCode: string;
  paymentMethod: string;
  status: string;
  installments: number;
  currency: string;
  saleDate: string;
  confirmationDate: string | null;
  coupon: string | null;
  offerCode: string | null;
  hotmartId: string | null;
  providerData: Record<string, unknown>;
}

interface ImportResult {
  transactionId: string;
  status: "created" | "updated" | "skipped" | "error";
  message?: string;
}

type TransactionStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "refunded"
  | "disputed";

type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "pix"
  | "boleto"
  | "bank_transfer"
  | "paypal"
  | "other";

// Cache de produtos e alunos para evitar consultas repetidas
const productCache: Map<string, string | null> = new Map();
const studentCache: Map<string, string | null> = new Map();

function mapHotmartStatus(status: string): TransactionStatus {
  const statusMap: Record<string, TransactionStatus> = {
    approved: "approved",
    complete: "approved", // Completo = Aprovado no banco
    completed: "approved", // Completo = Aprovado no banco
    refunded: "refunded",
    cancelled: "cancelled",
    canceled: "cancelled",
    chargeback: "disputed",
    billet_printed: "pending",
    waiting_payment: "pending",
    expired: "cancelled",
    dispute: "disputed",
    blocked: "cancelled",
    delayed: "pending",
    overdue: "cancelled",
    pre_order: "pending",
    protest: "disputed",
    recovery: "pending",
    started: "pending",
    under_analisys: "pending",
    under_analysis: "pending",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

function mapPaymentMethod(method: string): PaymentMethod {
  const methodMap: Record<string, PaymentMethod> = {
    credit_card: "credit_card",
    creditcard: "credit_card",
    debit_card: "debit_card",
    pix: "pix",
    boleto: "boleto",
    billet: "boleto",
    bank_transfer: "bank_transfer",
    transfer: "bank_transfer",
    paypal: "paypal",
  };

  return methodMap[method.toLowerCase()] || "other";
}

async function loadStudentsCache(supabase: SupabaseClient): Promise<void> {
  console.log("Carregando alunos existentes...");
  const { data: existingStudents } = await supabase
    .from("usuarios")
    .select("id, email")
    .eq("empresa_id", EMPRESA_ID);

  if (existingStudents) {
    for (const student of existingStudents) {
      studentCache.set(student.email.toLowerCase(), student.id);
    }
    console.log(`  ${studentCache.size} alunos carregados no cache`);
  }
}

async function loadProductsCache(supabase: SupabaseClient): Promise<void> {
  console.log("Carregando produtos existentes...");
  const { data: existingProducts } = await supabase
    .from("products")
    .select("id, provider_product_id")
    .eq("empresa_id", EMPRESA_ID);

  if (existingProducts) {
    for (const product of existingProducts) {
      if (product.provider_product_id) {
        productCache.set(product.provider_product_id, product.id);
      }
    }
    console.log(`  ${productCache.size} produtos carregados no cache`);
  }
}

async function findOrCreateProduct(
  supabase: SupabaseClient,
  productCode: string,
  productName: string
): Promise<string | null> {
  // Check cache first
  if (productCache.has(productCode)) {
    return productCache.get(productCode) || null;
  }

  // Try to find existing product
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("empresa_id", EMPRESA_ID)
    .eq("provider", PROVIDER)
    .eq("provider_product_id", productCode)
    .maybeSingle();

  if (existing) {
    productCache.set(productCode, existing.id);
    return existing.id;
  }

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Criaria produto: ${productName} (${productCode})`);
    return null;
  }

  // Create new product
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert({
      empresa_id: EMPRESA_ID,
      name: productName,
      price_cents: 0,
      currency: "BRL",
      provider: PROVIDER,
      provider_product_id: productCode,
      active: true,
      metadata: {},
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  Erro ao criar produto: ${error.message}`);
    return null;
  }

  productCache.set(productCode, newProduct.id);
  console.log(`  Produto criado: ${productName}`);
  return newProduct.id;
}

async function main() {
  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY sao obrigatorios"
    );
    console.log("Configure as variaveis no arquivo .env.local");
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Load transactions
  const jsonPath = path.join(__dirname, "hotmart-transactions-import.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Arquivo nao encontrado: ${jsonPath}`);
    console.log("Execute o script Python primeiro para gerar o arquivo JSON.");
    process.exit(1);
  }

  const transactions: HotmartTransaction[] = JSON.parse(
    fs.readFileSync(jsonPath, "utf-8")
  );

  console.log(`${transactions.length} transacoes para importar`);
  console.log(`Empresa: Jana Rabelo (${EMPRESA_ID})`);

  if (DRY_RUN) {
    console.log("\nMODO DRY-RUN: Nenhuma alteracao sera feita\n");
  }

  // Load caches
  await loadStudentsCache(supabase);
  await loadProductsCache(supabase);

  const results: ImportResult[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // First, create unique products
  const uniqueProducts = new Map<string, string>();
  for (const tx of transactions) {
    if (tx.productCode && !uniqueProducts.has(tx.productCode)) {
      uniqueProducts.set(tx.productCode, tx.productName);
    }
  }

  console.log(`\nCriando ${uniqueProducts.size} produtos...`);
  for (const [code, name] of uniqueProducts) {
    await findOrCreateProduct(supabase, code, name);
  }

  // Now import transactions
  console.log(`\nImportando ${transactions.length} transacoes...`);
  for (const tx of transactions) {
    const transactionId = tx.providerTransactionId || "N/A";

    if (!tx.providerTransactionId || !tx.buyerEmail) {
      results.push({
        transactionId,
        status: "error",
        message: "Campos obrigatorios ausentes (providerTransactionId, buyerEmail)",
      });
      errors++;
      continue;
    }

    try {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from("transactions")
        .select("id, status")
        .eq("empresa_id", EMPRESA_ID)
        .eq("provider", PROVIDER)
        .eq("provider_transaction_id", tx.providerTransactionId)
        .maybeSingle();

      if (existing) {
        // Update if status changed
        const newStatus = mapHotmartStatus(tx.status);
        if (existing.status !== newStatus) {
          if (!DRY_RUN) {
            await supabase
              .from("transactions")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          }
          results.push({
            transactionId,
            status: "updated",
            message: `Status atualizado: ${existing.status} -> ${newStatus}`,
          });
          updated++;
        } else {
          results.push({
            transactionId,
            status: "skipped",
            message: "Transacao ja existe com mesmo status",
          });
          skipped++;
        }
        continue;
      }

      // Get student and product from cache
      const alunoId = studentCache.get(tx.buyerEmail.toLowerCase()) || null;
      const productId = productCache.get(tx.productCode) || null;

      if (DRY_RUN) {
        console.log(
          `  [DRY-RUN] Criaria: ${transactionId} - ${tx.buyerEmail} - ${tx.productName}`
        );
        results.push({
          transactionId,
          status: "created",
          message: "Seria criado (dry-run)",
        });
        created++;
        continue;
      }

      // Create transaction
      const { error: insertError } = await supabase.from("transactions").insert({
        empresa_id: EMPRESA_ID,
        usuario_id: alunoId,
        product_id: productId,
        provider: PROVIDER,
        provider_transaction_id: tx.providerTransactionId,
        status: mapHotmartStatus(tx.status),
        amount_cents: 0, // Valor nao disponivel no export
        currency: tx.currency || "BRL",
        payment_method: mapPaymentMethod(tx.paymentMethod),
        installments: tx.installments,
        buyer_name: tx.buyerName,
        buyer_email: tx.buyerEmail.toLowerCase(),
        buyer_document: tx.buyerDocument,
        provider_data: {
          ...tx.providerData,
          hotmart_id: tx.hotmartId,
          offer_code: tx.offerCode,
          coupon: tx.coupon,
        },
        sale_date: tx.saleDate,
        confirmation_date: tx.confirmationDate,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      results.push({
        transactionId,
        status: "created",
        message: "Criado com sucesso",
      });
      created++;

      if (created % 50 === 0) {
        console.log(`  Progresso: ${created} transacoes criadas...`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      results.push({
        transactionId,
        status: "error",
        message,
      });
      errors++;
      console.error(`  ${transactionId}: ${message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("RESUMO DA IMPORTACAO DE TRANSACOES");
  console.log("=".repeat(50));
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Pulados: ${skipped}`);
  console.log(`Erros: ${errors}`);
  console.log(`Total processado: ${transactions.length}`);

  // Save report
  const reportPath = path.join(__dirname, "import-transactions-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nRelatorio salvo em: ${reportPath}`);

  if (DRY_RUN) {
    console.log("\nExecute sem --dry-run para aplicar as alteracoes");
  }
}

main().catch(console.error);
