import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("=== VERIFICAÇÃO FINAL - VISIBILIDADE NA UI ===\n");

  // 1. Simular a query que a UI faz
  // Baseado no repository: busca cursos da empresa, depois alunos_cursos, depois usuarios

  // Passo 1: Buscar cursos da empresa
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", EMPRESA_ID);

  const cursoIds = cursos?.map((c) => c.id) || [];
  console.log(`Cursos da empresa: ${cursoIds.length}`);

  // Passo 2: Buscar alunos vinculados a esses cursos
  const { data: alunosCursos } = await supabase
    .from("alunos_cursos")
    .select("usuario_id")
    .in("curso_id", cursoIds);

  const studentIds = Array.from(
    new Set(alunosCursos?.map((ac) => ac.usuario_id) || []),
  );
  console.log(`Alunos vinculados aos cursos: ${studentIds.length}`);

  // Passo 3: Filtrar por deleted_at (a UI não faz isso quando filtra por curso/empresa)
  // Mas vamos verificar ambos cenários

  const { count: withDeletedAt } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .in("id", studentIds);

  console.log(`Total de usuários (incluindo deleted): ${withDeletedAt}`);

  const { count: withoutDeletedAt } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .in("id", studentIds)
    .is("deleted_at", null);

  console.log(`Total de usuários (sem deleted_at): ${withoutDeletedAt}`);

  console.log("\n=== RESUMO ===");
  console.log(`✅ Alunos que DEVEM aparecer na UI: ${withDeletedAt}`);
  console.log(`   (baseado na lógica do repository linha 198-234)`);
}

main();
