import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Sincronizando matriculas → alunos_cursos...\n");

  // 1. Buscar todas as matrículas da empresa
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("usuario_id, curso_id")
    .eq("empresa_id", EMPRESA_ID);

  if (matriculasError) {
    console.error("Erro ao buscar matrículas:", matriculasError);
    return;
  }

  console.log(`Total de matrículas: ${matriculas.length}`);

  // 2. Deduplicate within matriculas itself
  const uniqueLinks = new Map();
  matriculas.forEach((m) => {
    const key = `${m.usuario_id}|${m.curso_id}`;
    if (!uniqueLinks.has(key)) {
      uniqueLinks.set(key, { usuario_id: m.usuario_id, curso_id: m.curso_id });
    }
  });

  const toInsert = Array.from(uniqueLinks.values());
  console.log(`Após deduplicação: ${toInsert.length} vínculos únicos`);

  // 3. Inserir em lotes para evitar problemas
  const BATCH_SIZE = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const { error: upsertError } = await supabase
      .from("alunos_cursos")
      .upsert(batch, {
        onConflict: "usuario_id,curso_id",
        ignoreDuplicates: true,
      });

    if (upsertError) {
      console.error(
        `Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`,
        upsertError,
      );
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(
        `Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} vínculos`,
      );
    }
  }

  console.log(`\n✓ Processados: ${inserted} vínculos`);
  if (skipped > 0) {
    console.log(`⚠ Ignorados (erro): ${skipped} vínculos`);
  }

  // 4. Verificar resultado final
  const { count: finalCount } = await supabase
    .from("alunos_cursos")
    .select("*", { count: "exact", head: true });

  console.log(`\nTotal final em alunos_cursos: ${finalCount}`);

  // 5. Verificar quantos alunos únicos agora estão vinculados
  const { data: allLinks } = await supabase
    .from("alunos_cursos")
    .select("usuario_id");

  const uniqueStudents = new Set(allLinks?.map((l) => l.usuario_id) || []);
  console.log(`Alunos únicos com pelo menos 1 curso: ${uniqueStudents.size}`);
}

main();
