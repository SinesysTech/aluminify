import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("=== VERIFICAÇÃO FINAL - TODOS OS ALUNOS ===\n");

  // Total de usuários
  const { count: totalUsuarios } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);

  console.log(`Total de usuários cadastrados: ${totalUsuarios}`);

  // Usuários com deleted_at
  const { count: withDeleted } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID)
    .not("deleted_at", "is", null);

  console.log(`Usuários com deleted_at: ${withDeleted}`);

  // Usuários vinculados a cursos (visíveis na UI)
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", EMPRESA_ID);

  const { data: alunosCursos } = await supabase
    .from("alunos_cursos")
    .select("usuario_id")
    .in("curso_id", cursos?.map((c) => c.id) || []);

  const uniqueStudents = new Set(
    alunosCursos?.map((ac) => ac.usuario_id) || [],
  );
  console.log(`Usuários vinculados a cursos: ${uniqueStudents.size}`);

  console.log("\n=== RESUMO ===");
  console.log(`✅ TODOS os ${uniqueStudents.size} alunos devem aparecer na UI`);
  console.log(`   (sem filtro de deleted_at)`);

  // Breakdown por origem
  const { data: byOrigin } = await supabase
    .from("usuarios")
    .select("origem_cadastro")
    .eq("empresa_id", EMPRESA_ID)
    .in("id", Array.from(uniqueStudents));

  const originCounts = {};
  byOrigin?.forEach((u) => {
    const origin = u.origem_cadastro || "não especificado";
    originCounts[origin] = (originCounts[origin] || 0) + 1;
  });

  console.log("\nPor origem:");
  Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([origin, count]) => {
      console.log(`  - ${origin}: ${count}`);
    });
}

main();
