/**
 * Conta alunos cadastrados na empresa Jana Rabelo, por curso.
 * Usa alunos_cursos (matrículas) e cursos da empresa.
 *
 * Uso: npx tsx scripts/usuario/count-alunos-jana-rabelo-por-curso.ts
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const EMPRESA_NOME = "Jana Rabelo";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) em .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Empresa Jana Rabelo
  const { data: empresa, error: errEmpresa } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", EMPRESA_NOME)
    .maybeSingle();

  if (errEmpresa || !empresa?.id) {
    console.error("Empresa não encontrada:", EMPRESA_NOME, errEmpresa?.message ?? "");
    process.exit(1);
  }
  const empresaId = empresa.id;

  // 2) Cursos da empresa
  const { data: cursos, error: errCursos } = await supabase
    .from("cursos")
    .select("id, nome")
    .eq("empresa_id", empresaId)
    .order("nome");

  if (errCursos) {
    console.error("Erro ao buscar cursos:", errCursos.message);
    process.exit(1);
  }
  if (!cursos?.length) {
    console.log("Empresa:", empresa.nome, "— Nenhum curso encontrado.");
    process.exit(0);
  }

  const cursoIds = cursos.map((c) => c.id);

  // 3) Contagem por curso via alunos_cursos (usuario_id)
  const { data: alunosCursos, error: errAc } = await supabase
    .from("alunos_cursos")
    .select("curso_id, usuario_id")
    .in("curso_id", cursoIds);

  if (errAc) {
    console.error("Erro ao buscar matrículas (alunos_cursos):", errAc.message);
    process.exit(1);
  }

  const countAcPorCurso = new Map<string, number>();
  cursoIds.forEach((id) => countAcPorCurso.set(id, 0));
  (alunosCursos ?? []).forEach((r) => {
    if (r.curso_id) countAcPorCurso.set(r.curso_id, (countAcPorCurso.get(r.curso_id) ?? 0) + 1);
  });

  // 4) Contagem por curso via matriculas (aluno_id = alunos.id, curso_id)
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("curso_id, aluno_id")
    .eq("ativo", true);
  const countMatPorCurso = new Map<string, number>();
  cursoIds.forEach((id) => countMatPorCurso.set(id, 0));
  if (Array.isArray(matriculas)) {
    matriculas.forEach((m: { curso_id?: string; aluno_id?: string }) => {
      if (m.curso_id && cursoIds.includes(m.curso_id)) {
        countMatPorCurso.set(m.curso_id, (countMatPorCurso.get(m.curso_id) ?? 0) + 1);
      }
    });
  }

  // Saída: por curso (alunos_cursos + matriculas; total = soma, um aluno pode estar em ambos?)
  console.log("--- Alunos cadastrados na empresa:", empresa.nome, "---\n");
  console.log("Por curso:");
  console.log("  " + "Curso".padEnd(52) + "  alunos_cursos  matriculas  Total");
  console.log("  " + "-".repeat(52) + "  -----------  ----------  -----");

  let totalAc = 0;
  let totalMat = 0;
  let totalGeral = 0;
  for (const c of cursos) {
    const ac = countAcPorCurso.get(c.id) ?? 0;
    const mat = countMatPorCurso.get(c.id) ?? 0;
    totalAc += ac;
    totalMat += mat;
    const totalCurso = ac + mat;
    totalGeral += totalCurso;
    const nome = (c.nome ?? c.id).slice(0, 50);
    console.log("  " + nome.padEnd(52) + "  " + String(ac).padStart(11) + "  " + String(mat).padStart(10) + "  " + totalCurso);
  }

  console.log("  " + "-".repeat(52) + "  -----------  ----------  -----");
  console.log("  " + "TOTAL".padEnd(52) + "  " + String(totalAc).padStart(11) + "  " + String(totalMat).padStart(10) + "  " + totalGeral);

  // 5) Cadastrados sem vínculo com nenhum curso (Jana Rabelo)
  // Cadastrados = usuarios (empresa_id = Jana, qualquer ativo/deleted) + alunos (empresa_id = Jana)
  const { data: usuariosJana } = await supabase
    .from("usuarios")
    .select("id")
    .eq("empresa_id", empresaId);
  const { data: alunosJana } = await supabase
    .from("alunos")
    .select("id")
    .eq("empresa_id", empresaId);
  const cadastradosIds = new Set<string>();
  (usuariosJana ?? []).forEach((r) => cadastradosIds.add(r.id));
  (alunosJana ?? []).forEach((r) => cadastradosIds.add(r.id));

  // Com vínculo = pelo menos uma matrícula em algum curso da Jana (alunos_cursos ou matriculas)
  const comVinculoIds = new Set<string>();
  (alunosCursos ?? []).forEach((r: { usuario_id?: string }) => {
    if (r.usuario_id) comVinculoIds.add(r.usuario_id);
  });
  if (Array.isArray(matriculas)) {
    matriculas.forEach((m: { aluno_id?: string; curso_id?: string }) => {
      if (m.aluno_id && m.curso_id && cursoIds.includes(m.curso_id)) comVinculoIds.add(m.aluno_id);
    });
  }

  const semVinculoIds = [...cadastradosIds].filter((id) => !comVinculoIds.has(id));
  const totalCadastrados = cadastradosIds.size;
  const totalComVinculo = comVinculoIds.size;
  const totalSemVinculo = semVinculoIds.length;

  console.log("\n--- Cadastrados na empresa (Jana Rabelo) ---");
  console.log("  Total cadastrados (usuarios ou alunos com empresa_id = Jana Rabelo):", totalCadastrados);
  console.log("  Com vínculo em pelo menos um curso (alunos_cursos ou matriculas):   ", totalComVinculo);
  console.log("  Sem vínculo com nenhum curso:                                        ", totalSemVinculo);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
