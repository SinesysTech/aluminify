/**
 * Script para deletar um usuário e todos os vínculos conhecidos no app.
 *
 * Execute com:
 *   npx tsx scripts/delete-user.ts <email>
 *
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)
 *
 * ⚠️ ATENÇÃO: ação IRREVERSÍVEL.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Carregar variáveis de ambiente (padrão do projeto)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // fallback: .env, environment, etc.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  console.error(
    "   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DeleteTarget = { table: string; column: string; label?: string };

const DELETE_TARGETS: DeleteTarget[] = [
  // Dados de aluno (FK direto em public.alunos)
  { table: "aulas_concluidas", column: "aluno_id" },
  { table: "alunos_cursos", column: "aluno_id" },
  { table: "alunos_turmas", column: "aluno_id" },
  { table: "cronogramas", column: "aluno_id" },
  { table: "matriculas", column: "aluno_id" },
  { table: "progresso_atividades", column: "aluno_id" },
  { table: "progresso_flashcards", column: "aluno_id" },
  { table: "sessoes_estudo", column: "aluno_id" },
  { table: "transactions", column: "aluno_id" },

  // Dados ligados ao usuário (não necessariamente FK em alunos)
  { table: "chat_conversation_history", column: "user_id" },
  { table: "empresa_admins", column: "user_id" },

  // Perfis (em último caso, por id)
  { table: "usuarios", column: "id", label: "perfil usuario (staff)" },
  { table: "professores", column: "id", label: "perfil professor (legacy)" },
  { table: "alunos", column: "id", label: "perfil aluno" },
];

async function findAlunoIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("alunos")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    // Não bloquear a deleção por falha aqui: apenas reportar.
    console.warn(`[WARN] Falha ao buscar aluno por email: ${error.message}`);
    return null;
  }

  return (data as { id?: string } | null)?.id ?? null;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  // 1) Caminho preferencial: aluno (public.alunos.email é UNIQUE).
  // Isso evita depender de listUsers (que pode falhar por permissão/chave).
  const alunoId = await findAlunoIdByEmail(email);
  if (alunoId) {
    return alunoId;
  }

  // Não existe busca direta por email no Admin API; fazemos paginação.
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
    if (match?.id) {
      return match.id;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function deleteById(table: string, column: string, id: string) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq(column, id);

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, count: count ?? 0 };
}

async function resolveSecondaryAlunoIdByEmail(email: string): Promise<string | null> {
  // Mantido por back-compat do script: usa a mesma busca centralizada.
  return findAlunoIdByEmail(email);
}

async function main() {
  const rawEmail = process.argv[2];
  if (!rawEmail) {
    console.error("❌ Uso: npx tsx scripts/delete-user.ts <email>");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();

  console.log("🧨 Iniciando deleção de usuário");
  console.log("=".repeat(60));
  console.log(`📧 Email: ${email}`);

  const authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) {
    console.error(`❌ Usuário não encontrado no Auth: ${email}`);
    process.exit(2);
  }

  console.log(`✅ Auth user id: ${authUserId}`);

  // Alguns bancos antigos podem ter aluno registrado por email com id divergente.
  const alunoIdByEmail = await resolveSecondaryAlunoIdByEmail(email);
  const targetIds = new Set<string>([authUserId]);
  if (alunoIdByEmail && alunoIdByEmail !== authUserId) {
    console.warn(
      `⚠️ Encontrado public.alunos.id diferente do Auth id. Também será removido: ${alunoIdByEmail}`,
    );
    targetIds.add(alunoIdByEmail);
  }

  // 1) Apagar vínculos/linhas conhecidas (best-effort)
  for (const targetId of targetIds) {
    console.log("\n" + "-".repeat(60));
    console.log(`🧹 Limpando dados relacionados ao id: ${targetId}`);

    for (const { table, column, label } of DELETE_TARGETS) {
      const res = await deleteById(table, column, targetId);
      if (!res.ok) {
        console.log(
          `⚠️  ${label ?? table}.${column} -> erro: ${res.error}`,
        );
      } else if (res.count > 0) {
        console.log(`🗑️  ${label ?? table}: removidos ${res.count}`);
      }
    }
  }

  // 2) Deletar do Auth (isso remove o usuário do app de fato)
  console.log("\n" + "-".repeat(60));
  console.log(`🧾 Deletando usuário no Auth: ${authUserId}`);

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
    authUserId,
  );

  if (authDeleteError) {
    console.error(`❌ Falha ao deletar usuário no Auth: ${authDeleteError.message}`);
    process.exit(3);
  }

  console.log("✅ Usuário deletado no Auth com sucesso");
  console.log("=".repeat(60));
  console.log("✅ Concluído");
}

main().catch((err) => {
  console.error("❌ Erro inesperado:", err);
  process.exit(99);
});
