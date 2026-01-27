import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"

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
