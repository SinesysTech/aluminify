import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  console.log("=== TABELAS ENVOLVIDAS ===\n");

  // 1. Tabela usuarios
  console.log("1️⃣ TABELA: usuarios");
  console.log("   Armazena os dados dos alunos");
  const { count: usuariosCount } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);
  console.log(`   Total: ${usuariosCount} registros\n`);

  // 2. Tabela matriculas
  console.log("2️⃣ TABELA: matriculas");
  console.log("   Armazena as matrículas dos alunos em cursos");
  const { data: sampleMatricula } = await supabase
    .from("matriculas")
    .select("*")
    .eq("empresa_id", EMPRESA_ID)
    .limit(1);
  if (sampleMatricula && sampleMatricula.length > 0) {
    console.log("   Colunas:", Object.keys(sampleMatricula[0]).join(", "));
  }
  const { count: matriculasCount } = await supabase
    .from("matriculas")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", EMPRESA_ID);
  console.log(`   Total: ${matriculasCount} registros\n`);

  // 3. Tabela alunos_cursos
  console.log("3️⃣ TABELA: alunos_cursos");
  console.log("   Tabela de vinculação aluno-curso (usada pela UI)");
  const { data: sampleAlunoCurso } = await supabase
    .from("alunos_cursos")
    .select("*")
    .limit(1);
  if (sampleAlunoCurso && sampleAlunoCurso.length > 0) {
    console.log("   Colunas:", Object.keys(sampleAlunoCurso[0]).join(", "));
  }
  const { count: alunosCursosCount } = await supabase
    .from("alunos_cursos")
    .select("*", { count: "exact", head: true });
  console.log(`   Total: ${alunosCursosCount} registros\n`);

  // Comparação
  console.log("\n=== COMPARAÇÃO ===");
  console.log(`Temos ${matriculasCount} matrículas em 'matriculas'`);
  console.log(`Mas apenas ${alunosCursosCount} vínculos em 'alunos_cursos'`);
  console.log(
    `Diferença: ${matriculasCount - alunosCursosCount} matrículas sem vínculo!\n`,
  );

  // Verificar estrutura das matrículas
  console.log("=== EXEMPLO DE MATRÍCULA ===");
  const { data: exampleMatricula } = await supabase
    .from("matriculas")
    .select("usuario_id, curso_id, empresa_id, data_matricula, ativo")
    .eq("empresa_id", EMPRESA_ID)
    .limit(3);
  console.log(JSON.stringify(exampleMatricula, null, 2));

  console.log("\n=== EXEMPLO DE ALUNO_CURSO ===");
  const { data: exampleAlunoCurso } = await supabase
    .from("alunos_cursos")
    .select("*")
    .limit(3);
  console.log(JSON.stringify(exampleAlunoCurso, null, 2));
}

main();
