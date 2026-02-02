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
  // Dados de aluno (FK via usuario_id)
  { table: "aulas_concluidas", column: "aluno_id" },
  { table: "alunos_cursos", column: "usuario_id" },
  { table: "alunos_turmas", column: "aluno_id" },
  { table: "cronogramas", column: "aluno_id" },
  { table: "matriculas", column: "aluno_id" },
  { table: "progresso_atividades", column: "aluno_id" },
  { table: "progresso_flashcards", column: "aluno_id" },
  { table: "sessoes_estudo", column: "aluno_id" },
  { table: "transactions", column: "aluno_id" },

  // Dados ligados ao usuário
  { table: "chat_conversation_history", column: "user_id" },
  { table: "empresa_admins", column: "user_id" },

  // Perfil (em último caso, por id)
  { table: "usuarios", column: "id", label: "perfil usuario" },
];

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  // Buscar pelo perfil em public.usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!usuarioError && usuarioData?.id) {
    return usuarioData.id;
  }

  // Fallback: paginar Auth users.
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

  const targetIds = new Set<string>([authUserId]);

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
