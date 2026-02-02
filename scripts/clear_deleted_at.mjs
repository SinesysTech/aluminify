import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Limpando coluna deleted_at...\n");

  // Check how many have deleted_at set
  const { count: withDeleted } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .not("deleted_at", "is", null);

  console.log(`Usuários com deleted_at preenchido: ${withDeleted}`);

  if (withDeleted === 0) {
    console.log("✓ Nenhum usuário com deleted_at. Nada a fazer.");
    return;
  }

  // Clear deleted_at for all users in the tenant
  const { data, error } = await supabase
    .from("usuarios")
    .update({ deleted_at: null })
    .eq("empresa_id", EMPRESA_ID)
    .not("deleted_at", "is", null)
    .select("id");

  if (error) {
    console.error("Erro ao limpar deleted_at:", error);
    return;
  }

  console.log(
    `✓ Limpeza concluída! ${data?.length || 0} registros atualizados.`,
  );

  // Verify
  const { count: afterCount } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .is("deleted_at", null);

  console.log(`\nUsuários ativos (deleted_at = null): ${afterCount}`);
}

main();
