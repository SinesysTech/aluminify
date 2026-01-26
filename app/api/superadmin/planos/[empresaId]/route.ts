import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"

/**
 * PATCH /api/superadmin/planos/[empresaId]
 * Altera o plano de uma empresa (apenas superadmin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode acessar esta rota." },
        { status: 403 }
      )
    }

    const { empresaId } = await params
    const body = await request.json()
    const { plano } = body

    if (!plano || !["basico", "profissional", "enterprise"].includes(plano)) {
      return NextResponse.json(
        { error: "Plano inválido. Use: basico, profissional ou enterprise" },
        { status: 400 }
      )
    }

    const adminClient = getDatabaseClient()

    // Check if empresa exists
    const { data: empresa, error: findError } = await adminClient
      .from("empresas")
      .select("id, nome, plano")
      .eq("id", empresaId)
      .is("deleted_at", null)
      .single()

    if (findError || !empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      )
    }

    const planoAnterior = empresa.plano

    // Update plano
    const { data: updated, error: updateError } = await adminClient
      .from("empresas")
      .update({
        plano,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresaId)
      .select("id, nome, plano")
      .single()

    if (updateError) {
      console.error("Error updating empresa plano:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar plano" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        empresa: updated,
        planoAnterior,
        planoNovo: plano,
      },
      message: `Plano da empresa ${empresa.nome} alterado de ${planoAnterior} para ${plano}`,
    })
  } catch (error) {
    console.error("Error in plano change endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
