import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Investigando estrutura da tabela usuarios...\n");

  // Get a sample user to see all fields
  const { data: sampleUsers, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("empresa_id", EMPRESA_ID)
    .limit(3);

  if (error) {
    console.error("Erro:", error);
    return;
  }

  if (sampleUsers && sampleUsers.length > 0) {
    console.log("Colunas da tabela usuarios:");
    console.log(Object.keys(sampleUsers[0]).sort());

    console.log("\n=== Exemplo de 3 registros ===");
    sampleUsers.forEach((u, idx) => {
      console.log(`\nUsuário ${idx + 1}:`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Nome: ${u.nome_completo}`);
      console.log(`  Origem: ${u.origem_cadastro}`);
      console.log(`  Ativo (campo ativo): ${u.ativo}`);
      console.log(`  Deleted_at: ${u.deleted_at}`);
      console.log(`  Created_at: ${u.created_at}`);
    });
  }

  // Count by ativo field
  console.log("\n=== Contagem por campo 'ativo' ===");
  const { count: ativoTrue } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("ativo", true);
  console.log(`ativo = true: ${ativoTrue}`);

  const { count: ativoFalse } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("ativo", false);
  console.log(`ativo = false: ${ativoFalse}`);

  const { count: ativoNull } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .is("ativo", null);
  console.log(`ativo = null: ${ativoNull}`);

  // Count from our imports
  console.log("\n=== Usuários das importações ===");
  const { count: multiImport } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("origem_cadastro", "excel_import_multi_2026");
  console.log(`excel_import_multi_2026: ${multiImport} usuários`);

  const { count: multiActive } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("origem_cadastro", "excel_import_multi_2026")
    .eq("ativo", true);
  console.log(`  └─ com ativo=true: ${multiActive}`);

  const { count: salinhaImport } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("origem_cadastro", "excel_import_2026");
  console.log(`\nexcel_import_2026: ${salinhaImport} usuários`);

  const { count: salinhaActive } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .eq("origem_cadastro", "excel_import_2026")
    .eq("ativo", true);
  console.log(`  └─ com ativo=true: ${salinhaActive}`);
}

main();
