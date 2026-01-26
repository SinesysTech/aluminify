/**
 * Script para criar usuários Superadmin
 *
 * Execute com: npx tsx scripts/create-superadmin-users.ts
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
  console.error("   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface SuperAdminUser {
  email: string
  fullName: string
  password: string
}

const superAdminUsers: SuperAdminUser[] = [
  {
    email: "breno.meira@sinesys.com.br",
    fullName: "Breno Meira",
    password: generateSecurePassword(),
  },
  {
    email: "jordan.medeiros@sinesys.com.br",
    fullName: "Jordan Medeiros",
    password: generateSecurePassword(),
  },
]

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
  let password = ""
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function createSuperAdminUser(user: SuperAdminUser) {
  console.log(`\n📧 Criando usuário: ${user.email}`)

  // Verificar se já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u) => u.email === user.email)

  if (existingUser) {
    console.log(`   ⚠️  Usuário já existe. Atualizando role para superadmin...`)

    // Atualizar metadata para superadmin
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: {
          ...existingUser.user_metadata,
          role: "superadmin",
          full_name: user.fullName,
        },
      }
    )

    if (updateError) {
      console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
      return null
    }

    console.log(`   ✅ Role atualizado para superadmin`)
    return { ...existingUser, password: "(senha existente)" }
  }

  // Criar novo usuário
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true, // Já confirma o email
    user_metadata: {
      role: "superadmin",
      full_name: user.fullName,
    },
  })

  if (error) {
    console.error(`   ❌ Erro ao criar: ${error.message}`)
    return null
  }

  console.log(`   ✅ Usuário criado com sucesso`)
  console.log(`   🔑 Senha temporária: ${user.password}`)

  return { ...data.user, password: user.password }
}

async function main() {
  console.log("🚀 Iniciando criação de usuários Superadmin")
  console.log("=" .repeat(50))

  const results: Array<{ email: string; password: string; success: boolean }> = []

  for (const user of superAdminUsers) {
    const result = await createSuperAdminUser(user)
    results.push({
      email: user.email,
      password: result ? user.password : "",
      success: !!result,
    })
  }

  console.log("\n" + "=".repeat(50))
  console.log("📋 Resumo:")
  console.log("=".repeat(50))

  for (const result of results) {
    if (result.success) {
      console.log(`\n✅ ${result.email}`)
      console.log(`   Senha: ${result.password}`)
    } else {
      console.log(`\n❌ ${result.email} - Falhou`)
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log("⚠️  IMPORTANTE: Guarde as senhas em local seguro!")
  console.log("   Os usuários devem trocar a senha no primeiro acesso.")
  console.log("=".repeat(50))
}

main().catch(console.error)
