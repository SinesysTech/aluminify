/**
 * Lista usuários cadastrados que possuem, simultaneamente, acesso como aluno
 * e como professor/admin (staff).
 *
 * Uso: npx tsx scripts/usuario/list-users-aluno-and-staff.ts
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
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) em .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) IDs que são staff (professor/admin): tabela usuarios
  const { data: staffRows, error: errStaff } = await supabase
    .from("usuarios")
    .select("id, email, nome_completo, empresa_id, ativo, deleted_at")
    .eq("ativo", true)
    .is("deleted_at", null);

  if (errStaff) {
    console.error("Erro ao buscar usuarios (staff):", errStaff.message);
    process.exit(1);
  }

  const staffIds = new Set<string>((staffRows ?? []).map((r) => r.id));

  // 2) IDs que são aluno: usuarios_empresas.papel_base = 'aluno', matriculas.aluno_id, alunos_cursos.usuario_id
  const alunoIds = new Set<string>();

  // 2a) usuarios_empresas com papel_base = 'aluno'
  const { data: alunosRows } = await supabase
    .from("usuarios_empresas")
    .select("usuario_id")
    .eq("papel_base", "aluno");
  (alunosRows ?? []).forEach((r) => { if (r.usuario_id) alunoIds.add(r.usuario_id); });

  // 2b) matriculas.aluno_id (aluno_id referencia auth.uid)
  const { data: matriculasRows } = await supabase
    .from("matriculas")
    .select("aluno_id");
  (matriculasRows ?? []).forEach((r) => {
    if (r.aluno_id) alunoIds.add(r.aluno_id);
  });

  // 2c) matriculas.usuario_id (se a coluna existir)
  const { data: matriculasUsuario } = await supabase
    .from("matriculas")
    .select("usuario_id");
  if (matriculasUsuario !== undefined && Array.isArray(matriculasUsuario)) {
    matriculasUsuario.forEach((r: { usuario_id?: string | null }) => {
      if (r?.usuario_id) alunoIds.add(r.usuario_id);
    });
  }

  // 2d) alunos_cursos: usuario_id
  const { data: acRows } = await supabase
    .from("alunos_cursos")
    .select("usuario_id");
  (acRows ?? []).forEach(
    (r: { usuario_id?: string | null }) => {
      if (r.usuario_id) alunoIds.add(r.usuario_id);
    },
  );

  // 3) Interseção: usuários que são staff E aluno
  const bothIds = new Set<string>();
  staffIds.forEach((id) => {
    if (alunoIds.has(id)) bothIds.add(id);
  });
  const both = Array.from(bothIds);

  // 4) Varredura por empresa: quantos (em cada empresa) estão nessa condição
  const { data: todasEmpresas, error: errEmpresas } = await supabase
    .from("empresas")
    .select("id, nome")
    .order("nome");

  if (errEmpresas) {
    console.error("Erro ao buscar empresas:", errEmpresas.message);
    process.exit(1);
  }

  // Por empresa: contar staff (usuarios) que também são alunos
  const countPorEmpresa = new Map<string, number>();
  (staffRows ?? []).forEach((r) => {
    if (!r.empresa_id) return;
    if (!bothIds.has(r.id)) return;
    countPorEmpresa.set(
      r.empresa_id,
      (countPorEmpresa.get(r.empresa_id) ?? 0) + 1,
    );
  });

  console.log("--- Varredura geral: ALUNO + PROFESSOR/ADMIN por empresa ---\n");
  console.log(
    "Total de usuários nessa condição (em qualquer empresa):",
    both.length,
  );
  console.log("");

  const empresasComDados = (todasEmpresas ?? []).filter((e) => e.id);
  if (empresasComDados.length === 0) {
    console.log("Nenhuma empresa encontrada.");
  } else {
    console.log("Por empresa:");
    console.log("  " + "Empresa".padEnd(50) + "  Quantidade");
    console.log("  " + "-".repeat(50) + "  ----------");
    let totalContagem = 0;
    empresasComDados.forEach((e) => {
      const nome = (e.nome ?? e.id).slice(0, 50);
      const q = countPorEmpresa.get(e.id) ?? 0;
      totalContagem += q;
      console.log("  " + nome.padEnd(50) + "  " + q);
    });
    console.log("  " + "-".repeat(50) + "  ----------");
    console.log(
      "  " +
        "(somente empresas com staff que também é aluno)".padEnd(50) +
        "  (soma: " +
        totalContagem +
        ")",
    );
  }

  // 5) Detalhes (lista completa) — opcional, comentado para não poluir; descomente se quiser
  const listarDetalhes = process.argv.includes("--lista");
  if (listarDetalhes && both.length > 0) {
    const { data: papeisData } = await supabase
      .from("papeis")
      .select("id, tipo");
    const papeisMap = new Map(
      (papeisData ?? []).map((p: { id: string; tipo: string }) => [
        p.id,
        p.tipo,
      ]),
    );
    const { data: usuariosComPapel } = await supabase
      .from("usuarios")
      .select("id, email, nome_completo, empresa_id, papel_id")
      .in("id", both);
    const empresaIds = Array.from(
      new Set(
        (usuariosComPapel ?? []).map((u) => u.empresa_id).filter(Boolean),
      ),
    ) as string[];
    let empresasMap: Record<string, string> = {};
    if (empresaIds.length > 0) {
      const { data: empData } = await supabase
        .from("empresas")
        .select("id, nome")
        .in("id", empresaIds);
      empresasMap = Object.fromEntries(
        (empData ?? []).map((e: { id: string; nome: string | null }) => [
          e.id,
          e.nome ?? e.id,
        ]),
      );
    }
    console.log("\n--- Lista de usuários (--lista) ---\n");
    (usuariosComPapel ?? []).forEach((u) => {
      const papelTipo = u.papel_id ? (papeisMap.get(u.papel_id) ?? "?") : "?";
      const empresaNome = u.empresa_id
        ? (empresasMap[u.empresa_id] ?? u.empresa_id)
        : "-";
      console.log(
        `  ${u.email ?? "(sem email)"} | ${empresaNome} (${papelTipo})`,
      );
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
