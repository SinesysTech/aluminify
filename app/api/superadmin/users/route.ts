import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/app/shared/core/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/superadmin/users
 * Lista todos os usuários superadmin
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Verificar se é superadmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_superadmin")
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Listar todos os usuários
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

    if (listError) {
      return NextResponse.json(
        { error: "Erro ao listar usuários" },
        { status: 500 }
      )
    }

    // Filtrar apenas superadmins
    const superadmins = usersData.users
      .filter((u) => u.user_metadata?.role === "superadmin")
      .map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        emailConfirmed: u.email_confirmed_at !== null,
      }))

    return NextResponse.json({ data: superadmins })
  } catch (error) {
    console.error("Error listing superadmins:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/superadmin/users
 * Cria um novo usuário superadmin
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Verificar se é superadmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_superadmin")
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obter dados do body
    const body = await request.json()
    const { email, fullName, password } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email e nome completo são obrigatórios" },
        { status: 400 }
      )
    }

    // Gerar senha se não fornecida
    const userPassword =
      password ||
      Array.from(
        { length: 16 },
        () =>
          "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"[
            Math.floor(Math.random() * 58)
          ]
      ).join("")

    // Verificar se já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)

    if (existingUser) {
      // Atualizar para superadmin
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            role: "superadmin",
            full_name: fullName,
          },
        }
      )

      if (updateError) {
        return NextResponse.json(
          { error: `Erro ao atualizar: ${updateError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data: {
          id: existingUser.id,
          email: existingUser.email,
          fullName,
          isNew: false,
        },
        message: "Usuário existente promovido a superadmin",
      })
    }

    // Criar novo usuário
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: userPassword,
        email_confirm: true,
        user_metadata: {
          role: "superadmin",
          full_name: fullName,
        },
      })

    if (createError) {
      return NextResponse.json(
        { error: `Erro ao criar: ${createError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        fullName,
        temporaryPassword: userPassword,
        isNew: true,
      },
      message: "Superadmin criado com sucesso",
    })
  } catch (error) {
    console.error("Error creating superadmin:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/superadmin/users
 * Remove o role de superadmin de um usuário
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Verificar se é superadmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_superadmin")
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obter userId do query param
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    // Não permitir remover a si mesmo
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode remover seu próprio acesso de superadmin" },
        { status: 400 }
      )
    }

    // Atualizar metadata para remover superadmin
    const { data: targetUser, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...targetUser.user.user_metadata,
          role: "usuario", // Rebaixar para usuário comum
        },
      }
    )

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao atualizar: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Acesso de superadmin removido com sucesso",
    })
  } catch (error) {
    console.error("Error removing superadmin:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
