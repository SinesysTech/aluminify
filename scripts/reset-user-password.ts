/**
 * Script para resetar senha de usuário
 *
 * Execute com: npx tsx scripts/reset-user-password.ts <email>
 *
 * Requer as variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas")
  console.error(
    "   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function generateSecurePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
  let password = ""
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function resetUserPassword(email: string) {
  console.log(`\n📧 Procurando usuário: ${email}`)

  // Listar usuários para encontrar o ID
  const { data: usersData, error: listError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (listError) {
    console.error(`❌ Erro ao listar usuários: ${listError.message}`)
    return null
  }

  const user = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`)
    return null
  }

  console.log(`   ✅ Usuário encontrado: ${user.id}`)
  console.log(`   📝 Nome: ${user.user_metadata?.full_name || "N/A"}`)
  console.log(`   📧 Email: ${user.email}`)

  const newPassword = generateSecurePassword()

  // Atualizar senha
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword,
    }
  )

  if (updateError) {
    console.error(`❌ Erro ao resetar senha: ${updateError.message}`)
    return null
  }

  console.log(`   ✅ Senha resetada com sucesso!`)

  return { email: user.email, password: newPassword }
}

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error("❌ Uso: npx tsx scripts/reset-user-password.ts <email>")
    process.exit(1)
  }

  console.log("🚀 Iniciando reset de senha")
  console.log("=".repeat(50))

  const result = await resetUserPassword(email)

  if (result) {
    console.log("\n" + "=".repeat(50))
    console.log("📋 Credenciais:")
    console.log("=".repeat(50))
    console.log(`   📧 Email: ${result.email}`)
    console.log(`   🔑 Nova senha: ${result.password}`)
    console.log("\n" + "=".repeat(50))
    console.log("⚠️  IMPORTANTE: Guarde a senha em local seguro!")
    console.log("   O usuário deve trocar a senha no primeiro acesso.")
    console.log("=".repeat(50))
  }
}

main().catch(console.error)
