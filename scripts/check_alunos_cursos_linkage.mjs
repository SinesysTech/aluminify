import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("Verificando vinculação na tabela alunos_cursos...\n");

  // Total de usuários importados
  const { data: importedUsers } = await supabase
    .from("usuarios")
    .select("id, email, origem_cadastro")
    .eq("empresa_id", EMPRESA_ID)
    .in("origem_cadastro", ["excel_import_multi_2026", "excel_import_2026"]);

  console.log(`Total de usuários importados: ${importedUsers?.length || 0}`);

  // Verificar quantos têm entrada em alunos_cursos
  if (importedUsers && importedUsers.length > 0) {
    const importedIds = importedUsers.map((u) => u.id);

    const { data: linkedCourses } = await supabase
      .from("alunos_cursos")
      .select("usuario_id")
      .in("usuario_id", importedIds);

    const linkedUserIds = new Set(
      linkedCourses?.map((l) => l.usuario_id) || [],
    );

    console.log(`Usuários com vínculo em alunos_cursos: ${linkedUserIds.size}`);
    console.log(
      `Usuários SEM vínculo em alunos_cursos: ${importedUsers.length - linkedUserIds.size}`,
    );

    // Mostrar alguns exemplos de usuários sem vínculo
    const usersWithoutLink = importedUsers.filter(
      (u) => !linkedUserIds.has(u.id),
    );
    if (usersWithoutLink.length > 0) {
      console.log(`\nExemplos de usuários sem vínculo (primeiros 5):`);
      usersWithoutLink.slice(0, 5).forEach((u) => {
        console.log(`  - ${u.email} (${u.origem_cadastro})`);
      });
    }
  }

  // Verificar também a tabela matriculas vs alunos_cursos
  console.log("\n=== Comparando matriculas vs alunos_cursos ===");

  // Usuários com matrícula na tabela matriculas
  const { data: enrollments } = await supabase
    .from("matriculas")
    .select("usuario_id")
    .eq("empresa_id", EMPRESA_ID);

  const usersWithMatriculas = new Set(
    enrollments?.map((e) => e.usuario_id) || [],
  );

  // Verificar se esses mesmos usuários têm entrada em alunos_cursos
  const { data: alunosCursos } = await supabase
    .from("alunos_cursos")
    .select("usuario_id")
    .in("usuario_id", Array.from(usersWithMatriculas));

  const usersWithAlunosCursos = new Set(
    alunosCursos?.map((ac) => ac.usuario_id) || [],
  );

  console.log(
    `Usuários com matrícula (tabela matriculas): ${usersWithMatriculas.size}`,
  );
  console.log(
    `Destes, quantos têm vínculo em alunos_cursos: ${usersWithAlunosCursos.size}`,
  );
  console.log(
    `Diferença: ${usersWithMatriculas.size - usersWithAlunosCursos.size} usuários`,
  );
}

main();
