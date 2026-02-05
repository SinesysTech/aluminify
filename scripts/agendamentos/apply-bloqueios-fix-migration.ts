/**
 * Aplica a migration de correção de bloqueios RLS.
 * 
 * Uso: npx tsx scripts/agendamentos/apply-bloqueios-fix-migration.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Defina env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n🔧 Aplicando migration de correção de bloqueios RLS...\n`);

  // Ler o arquivo SQL
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20260205180000_fix_bloqueios_rls_no_professores_table.sql"
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, "utf-8");

  // Dividir em statements individuais (separados por ;; ou ; no final de blocos)
  // Para funções PL/pgSQL, precisamos tratar de forma especial
  
  // Extrair cada seção CREATE OR REPLACE FUNCTION e DROP/CREATE POLICY
  const statements: string[] = [];
  
  // Regex para extrair funções (CREATE OR REPLACE FUNCTION ... $$;)
  const functionRegex = /CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/g;
  let match;
  while ((match = functionRegex.exec(sqlContent)) !== null) {
    statements.push(match[0]);
  }

  // Regex para extrair COMMENT ON FUNCTION
  const commentRegex = /COMMENT ON FUNCTION[^;]+;/g;
  while ((match = commentRegex.exec(sqlContent)) !== null) {
    statements.push(match[0]);
  }

  // Regex para extrair DROP POLICY
  const dropPolicyRegex = /DROP POLICY[^;]+;/g;
  while ((match = dropPolicyRegex.exec(sqlContent)) !== null) {
    statements.push(match[0]);
  }

  // Regex para extrair CREATE POLICY
  const _createPolicyRegex = /CREATE POLICY[\s\S]*?(?=CREATE POLICY|DROP POLICY|-- =|$)/g;
  const policySection = sqlContent.match(/-- SEÇÃO 6[\s\S]*?-- SEÇÃO 7/);
  if (policySection) {
    const policies = policySection[0].match(/CREATE POLICY[\s\S]*?\);/g);
    if (policies) {
      statements.push(...policies);
    }
  }

  console.log(`📝 Encontrados ${statements.length} statements para executar.`);
  console.log("");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;

    // Extrair nome para log
    let name = "Statement " + (i + 1);
    if (stmt.startsWith("CREATE OR REPLACE FUNCTION")) {
      const funcMatch = stmt.match(/FUNCTION\s+(\S+)/);
      name = `Função ${funcMatch?.[1] || "?"} `;
    } else if (stmt.startsWith("DROP POLICY")) {
      const policyMatch = stmt.match(/"([^"]+)"/);
      name = `Drop policy "${policyMatch?.[1] || "?"}"`;
    } else if (stmt.startsWith("CREATE POLICY")) {
      const policyMatch = stmt.match(/"([^"]+)"/);
      name = `Create policy "${policyMatch?.[1] || "?"}"`;
    } else if (stmt.startsWith("COMMENT")) {
      const funcMatch = stmt.match(/FUNCTION\s+(\S+)/);
      name = `Comment ${funcMatch?.[1] || "?"}`;
    }

    process.stdout.write(`   ${i + 1}. ${name}... `);

    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt });
      
      if (error) {
        // Se exec_sql não existe, tentar via SQL direto
        // Isso pode não funcionar para todos os statements
        console.log(`⚠️ RPC não disponível, tentando alternativo...`);
        errorCount++;
      } else {
        console.log(`✅`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : String(err)}`);
      errorCount++;
    }
  }

  console.log("");
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Resultado: ${successCount} sucesso, ${errorCount} erros`);
  
  if (errorCount > 0) {
    console.log("");
    console.log(`⚠️ Alguns statements falharam.`);
    console.log(`   Você pode precisar aplicar a migration manualmente.`);
    console.log(`   Arquivo: ${migrationPath}`);
    console.log("");
    console.log(`   Opções:`);
    console.log(`   1. Use o Supabase Dashboard > SQL Editor`);
    console.log(`   2. Execute: supabase db push (após login)`);
  }
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});
