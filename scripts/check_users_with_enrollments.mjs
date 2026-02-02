import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Verificando usuários com matrículas ativas...\n");

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from("matriculas")
    .select("usuario_id, ativo")
    .eq("empresa_id", EMPRESA_ID);

  if (!enrollments) {
    console.log("Erro ao buscar matrículas");
    return;
  }

  // Get unique user IDs with active enrollments
  const activeEnrollmentUserIds = new Set();
  const anyEnrollmentUserIds = new Set();

  enrollments.forEach((e) => {
    anyEnrollmentUserIds.add(e.usuario_id);
    if (e.ativo === true) {
      activeEnrollmentUserIds.add(e.usuario_id);
    }
  });

  console.log(`Usuários com alguma matrícula: ${anyEnrollmentUserIds.size}`);
  console.log(
    `Usuários com matrícula ativa (ativo=true): ${activeEnrollmentUserIds.size}`,
  );

  // Now check how many of these users also have ativo=true in usuarios table
  const { data: activeUsers } = await supabase
    .from("usuarios")
    .select("id")
    .eq("empresa_id", EMPRESA_ID)
    .eq("ativo", true);

  const activeUserIds = new Set(activeUsers?.map((u) => u.id) || []);

  // Intersection: users with ativo=true AND active enrollment
  const intersection = [...activeUserIds].filter((id) =>
    activeEnrollmentUserIds.has(id),
  );

  console.log(`\nUsuários com ativo=true no cadastro: ${activeUserIds.size}`);
  console.log(
    `Usuários com ativo=true E matrícula ativa: ${intersection.length}`,
  );

  // Check from our imports
  console.log("\n=== Das importações recentes ===");
  const { data: importedUsers } = await supabase
    .from("usuarios")
    .select("id")
    .eq("empresa_id", EMPRESA_ID)
    .in("origem_cadastro", ["excel_import_multi_2026", "excel_import_2026"]);

  const importedUserIds = new Set(importedUsers?.map((u) => u.id) || []);
  const importedWithEnrollments = [...importedUserIds].filter((id) =>
    activeEnrollmentUserIds.has(id),
  );

  console.log(`Total importado: ${importedUserIds.size} usuários`);
  console.log(
    `Com matrícula ativa: ${importedWithEnrollments.length} usuários`,
  );
}

main();
