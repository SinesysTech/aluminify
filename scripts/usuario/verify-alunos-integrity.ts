/**
 * Verifica se os alunos estão cadastrados de forma adequada no banco.
 *
 * Uso:
 *   npx tsx scripts/usuario/verify-alunos-integrity.ts
 *   npx tsx scripts/usuario/verify-alunos-integrity.ts cuca.beludo@email.com jacinto.rego@email.com
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const emailsToCheck = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);

  console.log("=== Verificação de integridade dos alunos ===\n");

  // 1) Alunos_cursos: referências válidas (usuario e curso existem)
  const { data: links, error: linksError } = await supabase
    .from("alunos_cursos")
    .select("usuario_id, curso_id");

  if (linksError) {
    console.error("Erro ao ler alunos_cursos:", linksError.message);
    process.exit(1);
  }

  const userIds = [...new Set((links ?? []).map((l) => l.usuario_id))];
  const cursoIds = [...new Set((links ?? []).map((l) => l.curso_id))];

  let usuarios: { id: string; empresa_id: string | null; email: string | null; nome_completo: string | null; deleted_at: string | null }[] = [];
  let cursos: { id: string; nome: string | null; empresa_id: string }[] = [];

  if (userIds.length > 0) {
    const r = await supabase.from("usuarios").select("id, empresa_id, email, nome_completo, deleted_at").in("id", userIds);
    if (r.error) {
      console.error("Erro ao ler usuarios:", r.error.message);
      process.exit(1);
    }
    usuarios = r.data ?? [];
  }
  if (cursoIds.length > 0) {
    const r = await supabase.from("cursos").select("id, nome, empresa_id").in("id", cursoIds);
    if (r.error) {
      console.error("Erro ao ler cursos:", r.error.message);
      process.exit(1);
    }
    cursos = r.data ?? [];
  }

  const usuarioMap = new Map(usuarios.map((u) => [u.id, u]));
  const cursoMap = new Map(cursos.map((c) => [c.id, c]));

  const problemas: string[] = [];
  const alunosSemEmpresa: string[] = [];
  const alunosSemNomeOuEmail: string[] = [];
  const matriculasEmpresaDiferente: string[] = [];
  const usuariosOrfaos: string[] = [];
  const cursosOrfaos: string[] = [];

  for (const link of links ?? []) {
    const u = usuarioMap.get(link.usuario_id);
    const c = cursoMap.get(link.curso_id);
    if (!u) usuariosOrfaos.push(link.usuario_id);
    if (!c) cursosOrfaos.push(link.curso_id);
    if (u && c && u.empresa_id !== c.empresa_id) {
      matriculasEmpresaDiferente.push(
        `usuario ${u.email} (empresa ${u.empresa_id}) matriculado em curso ${c.nome} (empresa ${c.empresa_id})`
      );
    }
  }

  for (const u of usuarios) {
    if (!u.empresa_id) alunosSemEmpresa.push(u.email ?? u.id);
    if (!u.nome_completo?.trim() || !u.email?.trim()) alunosSemNomeOuEmail.push(u.email ?? u.id);
  }

  if (usuariosOrfaos.length) problemas.push(`alunos_cursos com usuario_id inexistente: ${usuariosOrfaos.length}`);
  if (cursosOrfaos.length) problemas.push(`alunos_cursos com curso_id inexistente: ${cursosOrfaos.length}`);
  if (alunosSemEmpresa.length) problemas.push(`alunos sem empresa_id: ${alunosSemEmpresa.length}`);
  if (alunosSemNomeOuEmail.length) problemas.push(`alunos sem nome ou email: ${alunosSemNomeOuEmail.length}`);
  if (matriculasEmpresaDiferente.length) problemas.push(`matrículas com empresa do aluno ≠ empresa do curso: ${matriculasEmpresaDiferente.length}`);

  if (problemas.length > 0) {
    console.log("Problemas encontrados:");
    problemas.forEach((p) => console.log("  -", p));
    if (matriculasEmpresaDiferente.length > 0) {
      console.log("\nDetalhe (empresa diferente):");
      matriculasEmpresaDiferente.slice(0, 5).forEach((d) => console.log("  ", d));
      if (matriculasEmpresaDiferente.length > 5) console.log("  ... e mais", matriculasEmpresaDiferente.length - 5);
    }
    if (alunosSemEmpresa.length > 0) console.log("\nAlunos sem empresa_id:", alunosSemEmpresa.slice(0, 10).join(", "));
  } else {
    console.log("Nenhum problema de integridade encontrado (referências e empresa consistentes).");
  }

  // 2) Se passou emails, listar esses alunos e seus cursos
  if (emailsToCheck.length > 0) {
    console.log("\n--- Alunos por e-mail ---");
    const { data: byEmail } = await supabase
      .from("usuarios")
      .select("id, empresa_id, email, nome_completo, deleted_at")
      .in("email", emailsToCheck)
      .is("deleted_at", null);

    for (const u of byEmail ?? []) {
      const { data: ac } = await supabase
        .from("alunos_cursos")
        .select("curso_id")
        .eq("usuario_id", u.id);
      const ids = (ac ?? []).map((x) => x.curso_id);
      const nomes = ids.map((id) => cursoMap.get(id)?.nome ?? id).join(", ");
      console.log(`  ${u.email}`);
      console.log(`    nome: ${u.nome_completo ?? "(vazio)"}, empresa_id: ${u.empresa_id ?? "(vazio)"}`);
      console.log(`    cursos: ${nomes || "(nenhum)"}`);
    }
    const found = (byEmail ?? []).map((u: { email: string | null }) => u.email?.toLowerCase());
    const notFound = emailsToCheck.filter((e) => !found.includes(e));
    if (notFound.length) console.log("  Não encontrados:", notFound.join(", "));
  }

  console.log("\n=== Fim da verificação ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
