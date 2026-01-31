/**
 * Lista em quais cursos um usuário está cadastrado e a quais empresas está vinculado.
 *
 * Uso: npx tsx scripts/usuario/list-user-courses-and-empresas.ts <email>
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
  const email = process.argv[2]?.trim()?.toLowerCase();

  if (!url || !secretKey) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local");
    process.exit(1);
  }
  if (!email) {
    console.error("Uso: npx tsx scripts/usuario/list-user-courses-and-empresas.ts <email>");
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Usuário por email (usuarios)
  const { data: usuario, error: errU } = await supabase
    .from("usuarios")
    .select("id, empresa_id, email, nome_completo, deleted_at")
    .eq("email", email)
    .maybeSingle();

  if (errU) {
    console.error("Erro ao buscar usuário:", errU.message);
    process.exit(1);
  }
  if (!usuario) {
    console.log(`Usuário não encontrado: ${email}`);
    process.exit(0);
  }

  if (usuario.deleted_at) {
    console.log(`Usuário encontrado mas está excluído (deleted_at): ${email}`);
  }

  // 1b) Papéis e autorização (usuarios_empresas + papeis + empresa_admins)
  const { data: vinculos, error: errVe } = await supabase
    .from("usuarios_empresas")
    .select("empresa_id, papel_base, papel_id, is_admin, ativo")
    .eq("usuario_id", usuario.id)
    .is("deleted_at", null);

  if (!errVe && vinculos && vinculos.length > 0) {
    const papelIds = [...new Set((vinculos as { papel_id?: string }[]).map((v) => v.papel_id).filter(Boolean))] as string[];
    let papeisMap: Record<string, { tipo: string }> = {};
    if (papelIds.length > 0) {
      const { data: papeisData } = await supabase.from("papeis").select("id, tipo").in("id", papelIds);
      if (papeisData) papeisMap = Object.fromEntries((papeisData as { id: string; tipo: string }[]).map((p) => [p.id, { tipo: p.tipo }]));
    }
    const isAdminEmAlguma = (vinculos as { is_admin?: boolean }[]).some((v) => v.is_admin === true);
    const tipos = (vinculos as { papel_base?: string; papel_id?: string }[])
      .map((v) => (v.papel_id && papeisMap[v.papel_id] ? papeisMap[v.papel_id].tipo : v.papel_base))
      .filter(Boolean);
    const isStaff = (vinculos as { papel_base?: string }[]).some((v) => v.papel_base === "professor" || v.papel_base === "usuario");
    const isAdminRole = tipos.some((t) => String(t).toLowerCase().includes("admin"));
    const isAdmin = isAdminEmAlguma || isAdminRole;
    const isProfessor = tipos.some((t) => String(t).toLowerCase().includes("professor")) || isStaff;
    const isAluno = (vinculos as { papel_base?: string }[]).some((v) => v.papel_base === "aluno") || (!isStaff && vinculos.length > 0);
    // empresa_admins (admin explícito por empresa)
    const { data: adminsRows } = await supabase.from("empresa_admins").select("empresa_id, is_owner").eq("user_id", usuario.id);
    const isAdminEmpresa = (adminsRows?.length ?? 0) > 0;
    const adminFinal = isAdmin || isAdminEmpresa;
    console.log("");
    console.log("--- Autorização / Papéis ---");
    console.log("  Aluno:", isAluno ? "sim" : "não");
    console.log("  Professor/Usuário (staff):", isProfessor ? "sim" : "não");
    console.log("  Admin:", adminFinal ? "sim" : "não", adminFinal && isAdminEmpresa ? "(empresa_admins)" : "");
    if (tipos.length) console.log("  Tipos de papel:", [...new Set(tipos)].join(", "));
  } else {
    // Fallback: só matrícula em curso = aluno
    const { data: ac } = await supabase.from("alunos_cursos").select("curso_id").eq("usuario_id", usuario.id);
    const soAluno = (ac?.length ?? 0) > 0 && !vinculos?.length;
    console.log("");
    console.log("--- Autorização / Papéis ---");
    console.log("  Sem vínculo em usuarios_empresas. Considerado:", soAluno ? "aluno (apenas matrícula em curso)" : "indeterminado");
  }

  // 2) Matrículas (alunos_cursos)
  const { data: matriculas, error: errAc } = await supabase
    .from("alunos_cursos")
    .select("curso_id")
    .eq("usuario_id", usuario.id);

  if (errAc) {
    console.error("Erro ao buscar matrículas:", errAc.message);
    process.exit(1);
  }

  const cursoIds = [...new Set((matriculas ?? []).map((m) => m.curso_id))];
  let cursos: { id: string; nome: string | null; empresa_id: string }[] = [];

  if (cursoIds.length > 0) {
    const { data: cursosData, error: errC } = await supabase
      .from("cursos")
      .select("id, nome, empresa_id")
      .in("id", cursoIds);
    if (errC) {
      console.error("Erro ao buscar cursos:", errC.message);
      process.exit(1);
    }
    cursos = cursosData ?? [];
  }

  // 3) Empresas únicas: da usuario + dos cursos
  const empresaIds = new Set<string>();
  if (usuario.empresa_id) empresaIds.add(usuario.empresa_id);
  cursos.forEach((c) => c.empresa_id && empresaIds.add(c.empresa_id));

  let empresas: { id: string; nome: string | null }[] = [];
  if (empresaIds.size > 0) {
    const { data: empData, error: errE } = await supabase
      .from("empresas")
      .select("id, nome")
      .in("id", [...empresaIds]);
    if (!errE) empresas = empData ?? [];
  }

  // Saída
  console.log("--- Usuário ---");
  console.log("E-mail:", usuario.email);
  console.log("Nome:", usuario.nome_completo ?? "(vazio)");
  console.log("ID:", usuario.id);
  console.log("");
  console.log("--- Empresas vinculadas ---");
  if (empresas.length === 0) {
    console.log("Nenhuma empresa encontrada (usuário pode não ter empresa_id e não estar em nenhum curso).");
  } else {
    empresas.forEach((e) => {
      const via = usuario.empresa_id === e.id ? "via usuarios.empresa_id" : "via curso(s)";
      console.log(`  ${e.nome ?? e.id} (${e.id}) — ${via}`);
    });
  }
  console.log("");
  console.log("--- Cursos em que está cadastrado ---");
  if (cursos.length === 0) {
    console.log("Nenhum curso.");
  } else {
    cursos.forEach((c) => {
      const emp = empresas.find((e) => e.id === c.empresa_id);
      console.log(`  ${c.nome ?? c.id} (${c.id}) — empresa: ${emp?.nome ?? c.empresa_id}`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
