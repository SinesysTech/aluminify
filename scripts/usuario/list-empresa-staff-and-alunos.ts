/**
 * Lista staff (professor/usuário/admin) e conta alunos de uma empresa por nome.
 *
 * Uso: npx tsx scripts/usuario/list-empresa-staff-and-alunos.ts "Terra Negra"
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const empresaNome = process.argv[2]?.trim();

  if (!url || !secretKey) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) em .env.local");
    process.exit(1);
  }
  if (!empresaNome) {
    console.error('Uso: npx tsx scripts/usuario/list-empresa-staff-and-alunos.ts "Nome da Empresa"');
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Buscar empresa por nome
  const { data: empresaExata } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", empresaNome)
    .maybeSingle();

  let empresa: { id: string; nome: string } | null = empresaExata as { id: string; nome: string } | null;
  if (!empresa?.id) {
    const { data: list } = await supabase
      .from("empresas")
      .select("id, nome")
      .ilike("nome", `%${empresaNome}%`)
      .limit(20);
    const normalized = empresaNome.toLowerCase();
    const pick = (list ?? []).find(
      (e) => String((e as { nome?: string }).nome ?? "").toLowerCase() === normalized
    ) ?? (list ?? [])[0];
    if (!pick?.id) {
      console.error(`Empresa não encontrada: "${empresaNome}"`);
      process.exit(1);
    }
    empresa = { id: (pick as { id: string }).id, nome: (pick as { nome: string }).nome ?? "" };
  }

  const empresaId = empresa.id;
  console.log("--- Empresa ---");
  console.log(`${empresa.nome} (${empresaId})\n`);

  // 2) Staff: usuarios_empresas com papel_base professor/usuario OU is_admin = true
  const { data: vinculos, error: errVe } = await supabase
    .from("usuarios_empresas")
    .select("usuario_id, empresa_id, papel_base, papel_id, is_admin, ativo")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .is("deleted_at", null);

  if (errVe) {
    console.error("Erro ao buscar usuarios_empresas:", errVe.message);
    process.exit(1);
  }

  const staffVinculos = (vinculos ?? []).filter(
    (v: { papel_base?: string; is_admin?: boolean }) =>
      v.papel_base === "professor" ||
      v.papel_base === "usuario" ||
      v.is_admin === true
  );

  const usuarioIds = [...new Set(staffVinculos.map((v: { usuario_id: string }) => v.usuario_id))];
  const papelIds = [...new Set((staffVinculos as { papel_id?: string }[]).map((v) => v.papel_id).filter(Boolean))] as string[];

  let papeisMap: Record<string, { tipo: string }> = {};
  if (papelIds.length > 0) {
    const { data: papeisData } = await supabase.from("papeis").select("id, tipo").in("id", papelIds);
    if (papeisData)
      papeisMap = Object.fromEntries(
        (papeisData as { id: string; tipo: string }[]).map((p) => [p.id, { tipo: p.tipo }])
      );
  }

  // empresa_admins: usuários que são admin na empresa (podem não estar em usuarios_empresas com papel staff)
  const { data: adminsRows } = await supabase
    .from("empresa_admins")
    .select("user_id")
    .eq("empresa_id", empresaId);

  const adminUserIds = new Set((adminsRows ?? []).map((r: { user_id: string }) => r.user_id));
  const allStaffUserIds = new Set([...usuarioIds, ...adminUserIds]);

  let usuarios: { id: string; email: string; nome_completo: string | null }[] = [];
  if (allStaffUserIds.size > 0) {
    const { data: usuData, error: errU } = await supabase
      .from("usuarios")
      .select("id, email, nome_completo")
      .in("id", [...allStaffUserIds])
      .is("deleted_at", null);
    if (!errU && usuData) usuarios = usuData as typeof usuarios;
  }

  console.log("--- Usuários com cadastro ativo como Professor, Usuário/Staff ou Admin ---\n");
  if (usuarios.length === 0) {
    console.log("Nenhum usuário encontrado.\n");
  } else {
    for (const u of usuarios) {
      const vins = staffVinculos.filter((v: { usuario_id: string }) => v.usuario_id === u.id);
      const isAdminEmpresa = adminUserIds.has(u.id);
      const isAdmin = isAdminEmpresa || (vins as { is_admin?: boolean }[]).some((v) => v.is_admin);
      const tipos = (vins as { papel_base?: string; papel_id?: string }[])
        .map((v) => (v.papel_id && papeisMap[v.papel_id] ? papeisMap[v.papel_id].tipo : v.papel_base))
        .filter(Boolean);
      const roles: string[] = [];
      if (tipos.some((t) => String(t).toLowerCase().includes("professor"))) roles.push("Professor");
      if (tipos.some((t) => String(t) === "usuario" || String(t).toLowerCase().includes("usuario"))) roles.push("Usuário/Staff");
      if (isAdmin) roles.push("Admin");
      const roleStr = [...new Set(roles)].length ? [...new Set(roles)].join(", ") : "Staff";
      console.log(`  ${u.email}  |  ${u.nome_completo ?? "-"}  |  ${roleStr}`);
    }
    console.log("");
    console.log(`Total: ${usuarios.length} usuário(s).\n`);
  }

  // 3) Alunos com acesso na empresa
  // 3a) Por vínculo em usuarios_empresas (papel_base = aluno)
  const { data: alunosVinculos } = await supabase
    .from("usuarios_empresas")
    .select("usuario_id")
    .eq("empresa_id", empresaId)
    .eq("papel_base", "aluno")
    .eq("ativo", true)
    .is("deleted_at", null);

  const alunosPorVinculo = new Set((alunosVinculos ?? []).map((r: { usuario_id: string }) => r.usuario_id));

  // 3b) Por matrícula em curso da empresa (alunos_cursos + cursos)
  const { data: cursosEmpresa } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", empresaId);
  const cursoIds = (cursosEmpresa ?? []).map((c: { id: string }) => c.id);

  let alunosPorMatricula = 0;
  if (cursoIds.length > 0) {
    const { data: acRows } = await supabase
      .from("alunos_cursos")
      .select("usuario_id, aluno_id")
      .in("curso_id", cursoIds);
    const distinctAlunos = new Set(
      (acRows ?? []).map(
        (r: { usuario_id?: string; aluno_id?: string }) => r.usuario_id ?? r.aluno_id
      ).filter(Boolean)
    );
    alunosPorMatricula = distinctAlunos.size;
  }

  console.log("--- Acesso de Aluno na empresa ---");
  console.log(`  Usuários com vínculo de aluno (usuarios_empresas, papel aluno): ${alunosPorVinculo.size}`);
  console.log(`  Usuários com matrícula em curso da empresa (alunos_cursos): ${alunosPorMatricula}`);
  console.log("");
  const totalAlunos = Math.max(alunosPorVinculo.size, alunosPorMatricula) || alunosPorVinculo.size;
  console.log("Número de usuários da empresa com acesso de aluno:", totalAlunos, totalAlunos === alunosPorVinculo.size ? "(por vínculo papel aluno)" : "(por matrícula em curso)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
