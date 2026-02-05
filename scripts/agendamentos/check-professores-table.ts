/**
 * Verifica se a tabela professores existe e seu conteúdo.
 */

import * as dotenv from "dotenv";
import * as path from "path";
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
  console.log(`\n🔍 Verificando tabela 'professores'...\n`);

  // Tentar selecionar da tabela professores
  const { data, error } = await supabase
    .from("professores")
    .select("id, nome, email, empresa_id, is_admin")
    .limit(5);

  if (error) {
    console.log(`❌ Erro ao acessar tabela 'professores':`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Details: ${error.details}`);
    console.log(`   Hint: ${error.hint}`);
    console.log("");
    console.log(`⚠️ A tabela 'professores' provavelmente não existe!`);
    console.log(`   Isso afeta as políticas RLS que dependem dela.`);
  } else {
    console.log(`✅ Tabela 'professores' existe!`);
    console.log(`   Registros encontrados: ${data?.length || 0}`);
    if (data?.length) {
      console.log(`\n   Primeiros registros:`);
      for (const p of data) {
        console.log(`   - ${p.email} (${p.nome}) - admin: ${p.is_admin}`);
      }
    }
  }

  // Verificar estrutura do banco
  console.log(`\n📋 Verificando tabelas de usuários/papéis...`);
  
  const tables = ['usuarios', 'usuarios_empresas', 'professores', 'papeis'];
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('id').limit(1);
    const status = tableError ? `❌ Não existe/erro: ${tableError.message}` : `✅ Existe`;
    console.log(`   ${table}: ${status}`);
  }
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});
