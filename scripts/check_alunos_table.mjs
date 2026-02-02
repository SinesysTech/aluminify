import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Verificando tabelas de alunos...\n");

  // Check usuarios table
  const { count: usuariosCount } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);

  console.log(`Tabela 'usuarios': ${usuariosCount} registros`);

  // Check if alunos table exists and count
  const { count: alunosCount, error: alunosError } = await supabase
    .from("alunos")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);

  if (alunosError) {
    console.log(`Tabela 'alunos': ${alunosError.message}`);
  } else {
    console.log(`Tabela 'alunos': ${alunosCount} registros`);
  }

  // Check usuarios with deleted_at filter (common pattern)
  const { count: activeUsuarios } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .is("deleted_at", null);

  console.log(`Usuários ativos (deleted_at = null): ${activeUsuarios}`);

  // Try alunos with deleted_at filter
  const { count: activeAlunos } = await supabase
    .from("alunos")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .is("deleted_at", null);

  if (!alunosError) {
    console.log(`Alunos ativos (deleted_at = null): ${activeAlunos}`);
  }
}

main();
