/**
 * Diagnóstico: Por que "Conteúdo ainda não disponível" no cronograma (Terra Negra)?
 *
 * Verifica:
 * 1. Empresa Terra Negra existe e qual o slug
 * 2. Cursos da empresa
 * 3. Alunos matriculados e se conseguem "ver" os cursos (RLS)
 * 4. Função aluno_matriculado_empresa e get_user_empresa_id
 *
 * Uso: npx tsx scripts/usuario/diagnose-cronograma-terra-negra.ts
 *
 * Requer: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== Diagnóstico: Cronograma Terra Negra ===\n");

  // 1. Empresa Terra Negra
  const { data: empresasRaw } = await supabase
    .from("empresas")
    .select("id, nome, slug, subdomain, ativo")
    .ilike("nome", "%Terra Negra%");
  const empresa = (empresasRaw ?? []).find(
    (e) => String(e.nome ?? "").toLowerCase() === "terra negra"
  ) ?? (empresasRaw ?? [])[0];
  if (!empresa) {
    console.log("❌ Empresa 'Terra Negra' não encontrada.");
    process.exit(1);
  }

  console.log("1. EMPRESA");
  console.log(`   ID: ${empresa.id}`);
  console.log(`   Nome: ${empresa.nome}`);
  console.log(`   Slug: ${empresa.slug ?? "(não definido)"}`);
  console.log(`   Subdomain: ${empresa.subdomain ?? "(não definido)"}`);
  console.log(`   Ativo: ${empresa.ativo}`);
  console.log(
    `   URL esperada: /${empresa.slug || empresa.subdomain || "???"}/cronograma\n`
  );

  // 2. Cursos da empresa
  const { data: cursos, error: errCursos } = await supabase
    .from("cursos")
    .select("id, nome, empresa_id")
    .eq("empresa_id", empresa.id);

  if (errCursos) {
    console.error("Erro ao buscar cursos:", errCursos.message);
  } else {
    console.log("2. CURSOS DA EMPRESA");
    if (!cursos || cursos.length === 0) {
      console.log("   ❌ Nenhum curso cadastrado para esta empresa.");
      console.log(
        "   A instituição precisa cadastrar cursos em Conteúdo Programático.\n"
      );
    } else {
      console.log(`   Total: ${cursos.length} curso(s)`);
      cursos.forEach((c) => console.log(`   - ${c.nome} (${c.id})`));
      console.log("");
    }
  }

  // 3. Alunos matriculados (via alunos_cursos)
  const cursoIds = (cursos ?? []).map((c) => c.id);
  let matriculas: { usuario_id?: string }[] = [];
  if (cursoIds.length > 0) {
    const { data: ac } = await supabase
      .from("alunos_cursos")
      .select("usuario_id")
      .in("curso_id", cursoIds);
    matriculas = ac ?? [];
  }

  console.log("3. MATRÍCULAS (alunos_cursos)");
  if (matriculas.length === 0) {
    console.log("   Nenhum aluno matriculado nos cursos da empresa.");
  } else {
    const userIds = [...new Set(matriculas.map((m) => m.usuario_id).filter(Boolean))];
    console.log(`   Total: ${matriculas.length} matrícula(s), ${userIds.length} aluno(s) único(s)`);

    // Sample: check usuarios.empresa_id for first few
    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, email, empresa_id")
        .in("id", userIds.slice(0, 5));
      console.log("   Amostra usuarios (empresa_id para get_user_empresa_id):");
      (usuarios ?? []).forEach((u) =>
        console.log(`   - ${u.email}: empresa_id = ${u.empresa_id ?? "NULL"}`)
      );
    }
  }
  console.log("");

  // 4. Resumo e recomendação
  console.log("4. RESUMO");
  const temCursos = (cursos ?? []).length > 0;
  const temAlunos = matriculas.length > 0;

  if (!temCursos) {
    console.log(
      "   O problema é: a empresa não tem cursos cadastrados."
    );
    console.log(
      "   Solução: Cadastrar cursos (Conteúdo Programático) pela gestão da instituição."
    );
  } else if (!temAlunos) {
    console.log(
      "   Cursos existem, mas não há alunos matriculados."
    );
    console.log(
      "   Solução: Matricular alunos nos cursos (ou executar create-terra-negra-2026-students)."
    );
  } else {
    console.log(
      "   Cursos e matrículas existem. Se o aluno ainda vê 'Conteúdo não disponível':"
    );
    console.log("   a) Verificar se a URL está correta (slug da empresa)");
    console.log(
      `   b) Acessar: /${empresa.slug || empresa.subdomain || "???"}/cronograma`
    );
    console.log(
      "   c) A migração 20260131120000 corrige aluno_matriculado_empresa (usuario_id)."
    );
    console.log(
      "      Aplicar: supabase db push ou executar a migration manualmente."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
