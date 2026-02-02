import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Contando alunos no tenant jana-rabelo...\n");

  // Count all users in the tenant
  const { count: totalUsers, error: totalError } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);

  if (totalError) {
    console.error("Erro ao contar usuários:", totalError);
    return;
  }

  console.log(`Total de alunos cadastrados: ${totalUsers}`);

  // Count by origin
  const { data: byOrigin, error: originError } = await supabase
    .from("usuarios")
    .select("origem_cadastro")
    .eq("empresa_id", EMPRESA_ID);

  if (!originError && byOrigin) {
    const originCounts = {};
    byOrigin.forEach((u) => {
      const origin = u.origem_cadastro || "não especificado";
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    console.log("\nPor origem de cadastro:");
    Object.entries(originCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([origin, count]) => {
        console.log(`  - ${origin}: ${count}`);
      });
  }

  // Count total enrollments
  const { count: totalEnrollments, error: enrollError } = await supabase
    .from("matriculas")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);

  if (!enrollError) {
    console.log(`\nTotal de matrículas: ${totalEnrollments}`);
  }
}

main();
