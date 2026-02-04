/**
 * Script para definir senha de um usuário por email (admin).
 *
 * Uso: npx tsx scripts/set-user-password.ts <email> <nova_senha>
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  console.error(
    "   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setUserPassword(email: string, newPassword: string) {
  console.log(`\n📧 Procurando usuário: ${email}`);

  const { data: usersData, error: listError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (listError) {
    console.error(`❌ Erro ao listar usuários: ${listError.message}`);
    return false;
  }

  const user = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    return false;
  }

  console.log(`   ✅ Usuário encontrado: ${user.id}`);
  console.log(`   📝 Nome: ${user.user_metadata?.full_name || "N/A"}`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error(`❌ Erro ao definir senha: ${updateError.message}`);
    return false;
  }

  console.log(`   ✅ Senha alterada com sucesso.`);
  return true;
}

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error(
      "❌ Uso: npx tsx scripts/set-user-password.ts <email> <nova_senha>"
    );
    process.exit(1);
  }

  console.log("🚀 Alterando senha do usuário");
  console.log("=".repeat(50));

  const ok = await setUserPassword(email.trim().toLowerCase(), newPassword);
  process.exit(ok ? 0 : 1);
}

main().catch(console.error);
