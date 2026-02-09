/**
 * Repara matrículas faltantes de compras Hotmart já aprovadas.
 *
 * Cenário: transação Hotmart foi criada, aluno existe, mas não houve matrícula porque
 * o `hotmart_product_id` ainda não estava mapeado para um curso.
 *
 * Uso:
 *   npx tsx scripts/integracoes/financeiro/repair-hotmart-missing-enrollments.ts --empresa-id <UUID>
 *   npx tsx scripts/integracoes/financeiro/repair-hotmart-missing-enrollments.ts --empresa-id <UUID> --dry-run
 *   npx tsx scripts/integracoes/financeiro/repair-hotmart-missing-enrollments.ts --empresa-id <UUID> --limit 500
 *
 * Requisitos:
 * - NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente (.env.local)
 * - Tabela `cursos_hotmart_products` com o mapeamento correto
 */
import { createClient } from "@supabase/supabase-js";

function getArgValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

const DRY_RUN = process.argv.includes("--dry-run");
const EMPRESA_ID = getArgValue("--empresa-id") ?? process.env.EMPRESA_ID ?? null;
const LIMIT = Number.parseInt(getArgValue("--limit") ?? "200", 10);

type TxRow = {
  id: string;
  usuario_id: string | null;
  buyer_email: string | null;
  provider_data: Record<string, unknown> | null;
  created_at: string;
};

function getHotmartProductIdFromProviderData(providerData: Record<string, unknown> | null): string | null {
  const raw = providerData?.hotmart_product_id;
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  return str.length > 0 ? str : null;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios");
    process.exit(1);
  }

  if (!EMPRESA_ID) {
    console.error("Erro: informe --empresa-id <UUID> (ou defina EMPRESA_ID no ambiente)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Empresa: ${EMPRESA_ID}`);
  console.log(`Limit: ${LIMIT}`);
  if (DRY_RUN) console.log("MODO DRY-RUN: nenhuma alteração será feita.");

  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("id, usuario_id, buyer_email, provider_data, created_at")
    .eq("empresa_id", EMPRESA_ID)
    .eq("provider", "hotmart")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(LIMIT) ? LIMIT : 200);

  if (txError) {
    console.error(`Erro ao buscar transações: ${txError.message}`);
    process.exit(1);
  }

  const transactions = (txs ?? []) as TxRow[];
  console.log(`Transações aprovadas encontradas: ${transactions.length}`);

  let enrolled = 0;
  let skippedNoMapping = 0;
  let skippedNoUser = 0;
  let alreadyEnrolled = 0;
  let errors = 0;

  for (const tx of transactions) {
    try {
      const hotmartProductId = getHotmartProductIdFromProviderData(tx.provider_data);
      if (!hotmartProductId) {
        skippedNoMapping++;
        continue;
      }

      const { data: mapping, error: mappingError } = await supabase
        .from("cursos_hotmart_products")
        .select("curso_id")
        .eq("empresa_id", EMPRESA_ID)
        .eq("hotmart_product_id", hotmartProductId)
        .maybeSingle();

      if (mappingError) {
        throw new Error(`Erro ao buscar mapeamento do produto ${hotmartProductId}: ${mappingError.message}`);
      }

      if (!mapping?.curso_id) {
        skippedNoMapping++;
        continue;
      }

      // Resolver usuário (prioridade: usuario_id da transação; fallback: buyer_email)
      let usuarioId = tx.usuario_id;
      if (!usuarioId && tx.buyer_email) {
        const { data: usuarioByEmail, error: userError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("empresa_id", EMPRESA_ID)
          .eq("email", tx.buyer_email.toLowerCase())
          .maybeSingle();
        if (userError) {
          throw new Error(`Erro ao buscar usuário por email ${tx.buyer_email}: ${userError.message}`);
        }
        usuarioId = usuarioByEmail?.id ?? null;
      }

      if (!usuarioId) {
        skippedNoUser++;
        continue;
      }

      // Já matriculado?
      const { data: existing, error: existingError } = await supabase
        .from("alunos_cursos")
        .select("usuario_id")
        .eq("usuario_id", usuarioId)
        .eq("curso_id", mapping.curso_id)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Erro ao checar matrícula existente: ${existingError.message}`);
      }

      if (existing) {
        alreadyEnrolled++;
        continue;
      }

      console.log(
        `${DRY_RUN ? "[DRY-RUN] " : ""}Matriculando usuario=${usuarioId} no curso=${mapping.curso_id} (produto=${hotmartProductId}) tx=${tx.id}`,
      );

      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from("alunos_cursos")
          .insert({ usuario_id: usuarioId, curso_id: mapping.curso_id });

        if (insertError) {
          throw new Error(`Erro ao inserir matrícula: ${insertError.message}`);
        }

        // Atualizar provider_data para refletir a reparação (opcional, mas útil para auditoria)
        const providerData = tx.provider_data ?? {};
        const nextProviderData = {
          ...providerData,
          student_enrolled: true,
          curso_id: mapping.curso_id,
          repair_enrolled_at: new Date().toISOString(),
          repair_script: "repair-hotmart-missing-enrollments",
        };

        const { error: txUpdateError } = await supabase
          .from("transactions")
          .update({ provider_data: nextProviderData })
          .eq("id", tx.id);

        if (txUpdateError) {
          console.warn(`  Aviso: não foi possível atualizar provider_data da transação ${tx.id}: ${txUpdateError.message}`);
        }
      }

      enrolled++;
    } catch (e) {
      errors++;
      console.error(`Erro na transação ${tx.id}:`, e);
    }
  }

  console.log("\nResumo:");
  console.log(`- Matriculados: ${enrolled}`);
  console.log(`- Já estavam matriculados: ${alreadyEnrolled}`);
  console.log(`- Sem mapeamento (produto->curso): ${skippedNoMapping}`);
  console.log(`- Sem usuário associado: ${skippedNoUser}`);
  console.log(`- Erros: ${errors}`);
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});

