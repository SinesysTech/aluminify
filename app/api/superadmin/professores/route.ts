import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"
import { TeacherRepositoryImpl } from "@/app/[tenant]/(modules)/usuario/services"
import { EmpresaRepositoryImpl } from "@/app/[tenant]/(modules)/empresa/services"
import { createClient } from "@/app/shared/core/server"

/**
 * GET /api/superadmin/professores
 * Lista todos os professores de todas as empresas (apenas superadmin)
 *
 * Query params:
 * - search: busca por nome, email ou CPF
 * - empresaId: filtra por empresa
 * - isAdmin: filtra por admin (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode acessar esta rota." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const empresaId = searchParams.get("empresaId")
    const isAdmin = searchParams.get("isAdmin")

    const adminClient = getDatabaseClient()

    // Build query
    let query = adminClient
      .from("professores")
      .select(`
        id,
        email,
        nome_completo,
        cpf,
        telefone,
        especialidade,
        is_admin,
        empresa_id,
        created_at,
        updated_at,
        empresas:empresa_id (
          id,
          nome,
          slug
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(
        `nome_completo.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`
      )
    }

    if (empresaId && empresaId !== "all") {
      query = query.eq("empresa_id", empresaId)
    }

    if (isAdmin && isAdmin !== "all") {
      query = query.eq("is_admin", isAdmin === "true")
    }

    const { data: professores, error } = await query

    if (error) {
      console.error("Error fetching professores:", error)
      return NextResponse.json(
        { error: "Erro ao buscar professores" },
        { status: 500 }
      )
    }

    // Transform data
    const transformed = (professores || []).map((prof) => {
      const empresa = prof.empresas as { id: string; nome: string; slug: string } | null
      return {
        id: prof.id,
        email: prof.email,
        fullName: prof.nome_completo,
        cpf: prof.cpf,
        phone: prof.telefone,
        specialty: prof.especialidade,
        isAdmin: prof.is_admin,
        empresaId: prof.empresa_id,
        empresaNome: empresa?.nome || null,
        empresaSlug: empresa?.slug || null,
        createdAt: prof.created_at,
        updatedAt: prof.updated_at,
      }
    })

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error("Error in superadmin professores endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/superadmin/professores
 * Criar professor (apenas superadmin)
 * Permite criar professor com ou sem empresaId
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode criar professores." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      email,
      fullName,
      password,
      empresaId,
      cpf,
      phone,
      biography,
      photoUrl,
      specialty,
      isAdmin,
    } = body

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "email, fullName e password são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (empresaId) {
      const supabase = await createClient()
      const empresaRepository = new EmpresaRepositoryImpl(supabase)
      const empresa = await empresaRepository.findById(empresaId)

      if (!empresa) {
        return NextResponse.json(
          { error: "Empresa não encontrada" },
          { status: 404 }
        )
      }
    }

    const adminClient = getDatabaseClient()
    let newUser

    if (!empresaId) {
      const { data: tempUser, error: tempError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
          },
        })

      if (tempError || !tempUser.user) {
        return NextResponse.json(
          {
            error: `Erro ao criar usuário: ${tempError?.message || "Unknown error"}`,
          },
          { status: 500 }
        )
      }

      const { error: insertError } = await adminClient
        .from("professores")
        .insert({
          id: tempUser.user.id,
          email: email.toLowerCase(),
          nome_completo: fullName,
          empresa_id: empresaId || null,
          is_admin: isAdmin || false,
          cpf: cpf || null,
          telefone: phone || null,
          biografia: biography || null,
          foto_url: photoUrl || null,
          especialidade: specialty || null,
        })

      if (insertError) {
        console.error("Error creating professor record:", insertError)
        await adminClient.auth.admin.deleteUser(tempUser.user.id)
        return NextResponse.json(
          {
            error: `Erro ao criar registro de professor: ${insertError.message}`,
          },
          { status: 500 }
        )
      }

      const { data: updatedUser, error: updateError } =
        await adminClient.auth.admin.updateUserById(tempUser.user.id, {
          user_metadata: {
            role: "professor",
            full_name: fullName,
            is_admin: isAdmin || false,
          },
        })

      if (updateError || !updatedUser.user) {
        console.error("Error updating user metadata:", updateError)
      }

      newUser = { user: updatedUser?.user || tempUser.user }
    } else {
      const userMetadata: Record<string, unknown> = {
        role: "professor",
        full_name: fullName,
        empresa_id: empresaId,
        is_admin: isAdmin || false,
      }

      const { data: createdUser, error: userError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: userMetadata,
        })

      if (userError) {
        console.error("Error creating auth user:", userError)
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${userError.message}` },
          { status: 500 }
        )
      }

      if (!createdUser.user) {
        return NextResponse.json(
          { error: "Erro ao criar usuário" },
          { status: 500 }
        )
      }

      newUser = createdUser
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    const supabase = await createClient()
    const repository = new TeacherRepositoryImpl(supabase)
    const professor = await repository.findById(newUser.user.id)

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "Professor criado mas registro não encontrado. Tente novamente.",
        },
        { status: 500 }
      )
    }

    if (empresaId && (cpf || phone || biography || photoUrl || specialty)) {
      const updateData: Record<string, unknown> = {}
      if (cpf) updateData.cpf = cpf
      if (phone) updateData.phone = phone
      if (biography) updateData.biography = biography
      if (photoUrl) updateData.photoUrl = photoUrl
      if (specialty) updateData.specialty = specialty

      if (Object.keys(updateData).length > 0) {
        const updatedProfessor = await repository.update(
          newUser.user.id,
          updateData
        )
        return NextResponse.json(updatedProfessor, { status: 201 })
      }
    }

    return NextResponse.json(professor, { status: 201 })
  } catch (error) {
    console.error("Error creating professor:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar professor"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
