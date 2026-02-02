/**
 * Script para verificar vínculos (empresas/cursos) de um aluno por email.
 *
 * Execute com:
 *   npx tsx scripts/check-student-links.ts <email>
 *
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUsuarioIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar usuario por email: ${error.message}`);
  }

  return (data as { id?: string } | null)?.id ?? null;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  // Preferencial: buscar pelo perfil em `usuarios`.
  const usuarioId = await findUsuarioIdByEmail(email);
  if (usuarioId) return usuarioId;

  // Fallback: varrer Auth users (pode ser custoso em instâncias grandes).
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`Falha ao listar usuários do Auth: ${error.message}`);
    }

    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (match?.id) return match.id;

    if (users.length < perPage) return null;
    page += 1;
  }
}

type CursoRow = {
  id: string;
  nome: string;
  empresa_id: string;
};

type EmpresaRow = {
  id: string;
  nome: string;
  slug: string;
};

async function main() {
  const rawEmail = process.argv[2];
  if (!rawEmail) {
    console.error("❌ Uso: npx tsx scripts/check-student-links.ts <email>");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();

  console.log("🔎 Verificando vínculos do aluno");
  console.log("=".repeat(70));
  console.log(`📧 Email: ${email}`);

  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    console.log("❌ Nenhum usuário encontrado para este email.");
    process.exit(2);
  }

  console.log(`✅ user_id: ${userId}`);

  // 1) Cursos via alunos_cursos (fonte usada por get_aluno_empresas()/RLS)
  const { data: alunosCursos, error: acError } = await supabase
    .from("alunos_cursos")
    .select("curso_id, created_at")
    .eq("usuario_id", userId);
  if (acError) {
    throw new Error(`Falha ao buscar alunos_cursos: ${acError.message}`);
  }

  // 2) Cursos via matriculas (estrutura mais nova em alguns fluxos)
  const { data: matriculas, error: matError } = await supabase
    .from("matriculas")
    .select("curso_id, ativo, data_inicio_acesso, data_fim_acesso, data_matricula")
    .eq("aluno_id", userId);
  if (matError) {
    throw new Error(`Falha ao buscar matriculas: ${matError.message}`);
  }

  const courseIds = new Set<string>();
  for (const row of alunosCursos ?? []) {
    if (row?.curso_id) courseIds.add(row.curso_id);
  }
  for (const row of matriculas ?? []) {
    if (row?.curso_id) courseIds.add(row.curso_id);
  }

  if (courseIds.size === 0) {
    console.log("ℹ️ Nenhum vínculo com curso encontrado (alunos_cursos/matriculas).");
    process.exit(0);
  }

  const courseIdList = Array.from(courseIds);

  const { data: cursos, error: cursosError } = await supabase
    .from("cursos")
    .select("id, nome, empresa_id")
    .in("id", courseIdList);
  if (cursosError) {
    throw new Error(`Falha ao buscar cursos: ${cursosError.message}`);
  }

  const empresaIds = Array.from(
    new Set((cursos ?? []).map((c) => (c as CursoRow).empresa_id).filter(Boolean)),
  ) as string[];

  const { data: empresas, error: empresasError } = await supabase
    .from("empresas")
    .select("id, nome, slug")
    .in("id", empresaIds);
  if (empresasError) {
    throw new Error(`Falha ao buscar empresas: ${empresasError.message}`);
  }

  const empresasById = new Map<string, EmpresaRow>();
  for (const e of (empresas ?? []) as EmpresaRow[]) {
    empresasById.set(e.id, e);
  }

  // Agrupar cursos por empresa
  const coursesByEmpresa = new Map<
    string,
    Array<{ id: string; nome: string; sources: string[] }>
  >();

  // Mapear fontes (alunos_cursos vs matriculas)
  const sourceByCourse = new Map<string, Set<string>>();
  for (const row of alunosCursos ?? []) {
    if (!row?.curso_id) continue;
    if (!sourceByCourse.has(row.curso_id)) sourceByCourse.set(row.curso_id, new Set());
    sourceByCourse.get(row.curso_id)!.add("alunos_cursos");
  }
  for (const row of matriculas ?? []) {
    if (!row?.curso_id) continue;
    if (!sourceByCourse.has(row.curso_id)) sourceByCourse.set(row.curso_id, new Set());
    sourceByCourse.get(row.curso_id)!.add("matriculas");
  }

  for (const c of (cursos ?? []) as CursoRow[]) {
    const empresaId = c.empresa_id;
    if (!coursesByEmpresa.has(empresaId)) coursesByEmpresa.set(empresaId, []);
    coursesByEmpresa.get(empresaId)!.push({
      id: c.id,
      nome: c.nome,
      sources: Array.from(sourceByCourse.get(c.id) ?? []),
    });
  }

  // Ordenar
  for (const list of coursesByEmpresa.values()) {
    list.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const empresaEntries = Array.from(coursesByEmpresa.entries()).sort((a, b) => {
    const ea = empresasById.get(a[0])?.nome ?? a[0];
    const eb = empresasById.get(b[0])?.nome ?? b[0];
    return ea.localeCompare(eb);
  });

  console.log("\n🏢 Empresas e cursos vinculados");
  console.log("-".repeat(70));

  for (const [empresaId, cursosList] of empresaEntries) {
    const empresa = empresasById.get(empresaId);
    const empresaLabel = empresa
      ? `${empresa.nome} (slug: ${empresa.slug}, id: ${empresa.id})`
      : `Empresa desconhecida (id: ${empresaId})`;

    console.log(`\n- ${empresaLabel}`);
    for (const curso of cursosList) {
      const sources = curso.sources.length ? ` [via: ${curso.sources.join(", ")}]` : "";
      console.log(`  - ${curso.nome} (id: ${curso.id})${sources}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(
    `Resumo: ${empresaEntries.length} empresa(s), ${courseIdList.length} curso(s) únicos.`,
  );
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(99);
});

