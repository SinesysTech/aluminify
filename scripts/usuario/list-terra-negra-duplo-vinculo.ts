/**
 * Lista usuários da Terra Negra que têm vínculo duplo: professor/admin E aluno.
 *
 * Uso: npx tsx scripts/usuario/list-terra-negra-duplo-vinculo.ts
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const EMPRESA_NOME = "Terra Negra";

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

  // 1) Empresa Terra Negra
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

  // 2) Cursos da Terra Negra (para aluno = matrícula em curso da empresa)
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", empresaId);
  const cursoIds = (cursos ?? []).map((c: { id: string }) => c.id);

  // 3) Staff na Terra Negra: usuarios (empresa_id = Terra Negra, ativo, não deletado)
  const { data: staffRows, error: errStaff } = await supabase
    .from("usuarios")
    .select("id, email, nome_completo, empresa_id, papel_id")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .is("deleted_at", null);

  if (errStaff) {
    console.error("Erro ao buscar staff:", errStaff.message);
    process.exit(1);
  }
  const staffIds = new Set((staffRows ?? []).map((r) => r.id));

  // 4) Alunos (em qualquer lugar): alunos.id, alunos_cursos.usuario_id, matriculas.aluno_id
  const alunoIds = new Set<string>();
  const { data: alunosRows } = await supabase.from("alunos").select("id");
  (alunosRows ?? []).forEach((r) => alunoIds.add(r.id));
  const { data: matriculasRows } = await supabase.from("matriculas").select("aluno_id").eq("ativo", true);
  (matriculasRows ?? []).forEach((r) => { if (r.aluno_id) alunoIds.add(r.aluno_id); });
  const { data: acRows } = await supabase.from("alunos_cursos").select("usuario_id");
  (acRows ?? []).forEach((r: { usuario_id?: string | null }) => { if (r?.usuario_id) alunoIds.add(r.usuario_id); });

  // 5) Interseção: staff Terra Negra que também é aluno
  const duploVinculo = (staffRows ?? []).filter((r) => alunoIds.has(r.id));

  // 6) Admin na Terra Negra (empresa_admins) — se a tabela existir
  let adminUserIds = new Set<string>();
  try {
    const { data: admins } = await supabase
      .from("empresa_admins")
      .select("user_id")
      .eq("empresa_id", empresaId);
    if (Array.isArray(admins)) admins.forEach((a: { user_id?: string }) => { if (a?.user_id) adminUserIds.add(a.user_id); });
  } catch {
    // tabela pode não existir
  }

  // 7) Papeis (professor, professor_admin, etc.)
  const { data: papeisData } = await supabase.from("papeis").select("id, tipo");
  const papeisMap = new Map((papeisData ?? []).map((p: { id: string; tipo: string }) => [p.id, p.tipo]));

  // Saída
  console.log("--- Terra Negra: usuários com vínculo duplo (professor/admin + aluno) ---\n");
  console.log("Empresa:", empresa.nome, "(" + empresaId + ")\n");
  console.log("Total:", duploVinculo.length, "\n");

  if (duploVinculo.length === 0) {
    console.log("Nenhum usuário encontrado nessa condição.");
    process.exit(0);
  }

  console.log("  " + "E-mail".padEnd(45) + "  Nome (resumo)                    Papel staff    Admin");
  console.log("  " + "-".repeat(45) + "  " + "-".repeat(32) + "  " + "-".repeat(8));

  for (const u of duploVinculo) {
    const email = (u.email ?? "(sem email)").slice(0, 43);
    const nome = (u.nome_completo ?? "(vazio)").slice(0, 30);
    const papelTipo = u.papel_id ? (papeisMap.get(u.papel_id) ?? "?") : "?";
    const isAdmin = adminUserIds.has(u.id) ? "Sim" : "Não";
    console.log("  " + email.padEnd(45) + "  " + nome.padEnd(32) + "  " + papelTipo.padEnd(12) + "  " + isAdmin);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
