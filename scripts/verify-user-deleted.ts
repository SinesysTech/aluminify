/**
 * Verifica se um usuário foi removido do Auth e do perfil de usuario.
 *
 * Execute com:
 *   npx tsx scripts/verify-user-deleted.ts <email> <user_id_opcional>
 *
 * - Se user_id for fornecido, verifica diretamente via auth.admin.getUserById (sem listUsers).
 * - Sempre verifica se existe registro em public.usuarios por email.
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

async function main() {
  const rawEmail = process.argv[2];
  const userId = process.argv[3];

  if (!rawEmail) {
    console.error(
      "❌ Uso: npx tsx scripts/verify-user-deleted.ts <email> <user_id_opcional>",
    );
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();

  console.log("🧪 Verificando remoção de usuário");
  console.log("=".repeat(70));
  console.log(`📧 Email: ${email}`);
  if (userId) console.log(`🆔 user_id: ${userId}`);

  // 1) Verificar perfil de usuario por email
  const { data: usuarioRow, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, email, deleted_at")
    .eq("email", email)
    .maybeSingle();

  if (usuarioError) {
    console.log(`⚠️  Falha ao consultar public.usuarios: ${usuarioError.message}`);
  } else if (usuarioRow) {
    console.log("❌ Ainda existe registro em public.usuarios:", usuarioRow);
  } else {
    console.log("✅ Nenhum registro em public.usuarios para este email.");
  }

  // 2) Verificar no Auth por user_id (se informado)
  if (userId) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.log("✅ Auth: usuário não encontrado (deletado).");
    } else if (data?.user) {
      console.log("❌ Auth: usuário ainda existe:", {
        id: data.user.id,
        email: data.user.email,
      });
    } else {
      console.log("✅ Auth: usuário não encontrado (deletado).");
    }
  } else {
    console.log(
      "ℹ️  Auth: verificação por user_id não executada (user_id não informado).",
    );
  }

  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(99);
});

