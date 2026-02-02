/**
 * Script para corrigir o vínculo entre transactions e products
 * e criar as matrículas dos alunos
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

interface HotmartTransaction {
  buyerEmail: string;
  providerTransactionId: string;
  productCode: string;
  saleDate: string;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erro: variaveis de ambiente nao configuradas");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Load JSON
  const jsonPath = path.join(__dirname, "hotmart-transactions-import.json");
  const transactions: HotmartTransaction[] = JSON.parse(
    fs.readFileSync(jsonPath, "utf-8")
  );

  console.log(`${transactions.length} transacoes no JSON`);

  // Load products mapping
  const { data: products } = await supabase
    .from("products")
    .select("id, provider_product_id, curso_id")
    .eq("empresa_id", EMPRESA_ID);

  const productMap = new Map<string, { id: string; curso_id: string }>();
  for (const p of products || []) {
    if (p.provider_product_id) {
      productMap.set(p.provider_product_id, { id: p.id, curso_id: p.curso_id });
    }
  }
  console.log(`${productMap.size} produtos mapeados`);

  // Update transactions with product_id
  let updated = 0;
  let notFound = 0;

  for (const tx of transactions) {
    const product = productMap.get(tx.productCode);
    if (!product) {
      console.log(`  Produto nao encontrado: ${tx.productCode}`);
      notFound++;
      continue;
    }

    const { error } = await supabase
      .from("transactions")
      .update({ product_id: product.id })
      .eq("empresa_id", EMPRESA_ID)
      .eq("provider_transaction_id", tx.providerTransactionId);

    if (error) {
      console.error(`  Erro ao atualizar ${tx.providerTransactionId}: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\nTransacoes atualizadas: ${updated}`);
  console.log(`Produtos nao encontrados: ${notFound}`);

  // Now create matriculas for approved transactions
  console.log("\n=== CRIANDO MATRICULAS ===");

  const { data: approvedTx } = await supabase
    .from("transactions")
    .select(`
      id,
      buyer_email,
      sale_date,
      usuario_id,
      product_id,
      products!inner (curso_id)
    `)
    .eq("empresa_id", EMPRESA_ID)
    .eq("status", "approved")
    .not("product_id", "is", null);

  console.log(`${approvedTx?.length || 0} transacoes aprovadas com produto`);

  // Load existing matriculas to avoid duplicates
  const { data: existingMatriculas } = await supabase
    .from("matriculas")
    .select("usuario_id, curso_id")
    .eq("empresa_id", EMPRESA_ID);

  const matriculaSet = new Set<string>();
  for (const m of existingMatriculas || []) {
    matriculaSet.add(`${m.usuario_id}-${m.curso_id}`);
  }

  // Load alunos by email (modelo unificado: usuarios com vinculo aluno)
  const { data: alunos } = await supabase
    .from("usuarios")
    .select("id, email")
    .eq("empresa_id", EMPRESA_ID);

  const alunoMap = new Map<string, string>();
  for (const a of alunos || []) {
    alunoMap.set(a.email.toLowerCase(), a.id);
  }

  let matriculasCreated = 0;
  let matriculasSkipped = 0;

  for (const tx of approvedTx || []) {
    const alunoId = tx.usuario_id || alunoMap.get(tx.buyer_email.toLowerCase());
    const productsArray = tx.products as { curso_id: string }[];
    const cursoId = productsArray?.[0]?.curso_id;

    if (!alunoId || !cursoId) {
      console.log(`  Sem aluno ou curso: ${tx.buyer_email}`);
      continue;
    }

    const key = `${alunoId}-${cursoId}`;
    if (matriculaSet.has(key)) {
      matriculasSkipped++;
      continue;
    }

    const saleDate = tx.sale_date ? new Date(tx.sale_date) : new Date();
    const endDate = new Date(saleDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year access

    const { error } = await supabase.from("matriculas").insert({
      empresa_id: EMPRESA_ID,
      usuario_id: alunoId,
      curso_id: cursoId,
      data_matricula: saleDate.toISOString(),
      data_inicio_acesso: saleDate.toISOString().split("T")[0],
      data_fim_acesso: endDate.toISOString().split("T")[0],
      ativo: true,
    });

    if (error) {
      console.error(`  Erro ao criar matricula: ${error.message}`);
    } else {
      matriculaSet.add(key);
      matriculasCreated++;
    }
  }

  console.log(`\nMatriculas criadas: ${matriculasCreated}`);
  console.log(`Matriculas puladas (ja existiam): ${matriculasSkipped}`);
}

main().catch(console.error);
