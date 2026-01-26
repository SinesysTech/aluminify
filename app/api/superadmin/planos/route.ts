import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"
import { PLANOS_CONFIG } from "@/app/superadmin/planos/config"

/**
 * GET /api/superadmin/planos
 * Retorna configuração de planos e estatísticas (apenas superadmin)
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

    const adminClient = getDatabaseClient()

    // Get empresas grouped by plano
    const { data: empresas, error: empresasError } = await adminClient
      .from("empresas")
      .select("id, plano, ativo")
      .is("deleted_at", null)

    if (empresasError) {
      console.error("Error fetching empresas:", empresasError)
      return NextResponse.json(
        { error: "Erro ao buscar empresas" },
        { status: 500 }
      )
    }

    // Calculate distribution
    const distribution: Record<
      string,
      { total: number; ativas: number; empresaIds: string[] }
    > = {
      basico: { total: 0, ativas: 0, empresaIds: [] },
      profissional: { total: 0, ativas: 0, empresaIds: [] },
      enterprise: { total: 0, ativas: 0, empresaIds: [] },
    }

    ;(empresas || []).forEach((e) => {
      const plano = e.plano || "basico"
      if (distribution[plano]) {
        distribution[plano].total++
        distribution[plano].empresaIds.push(e.id)
        if (e.ativo) {
          distribution[plano].ativas++
        }
      }
    })

    const totalEmpresas = empresas?.length || 0

    // Get user counts per plan
    const planoStats = await Promise.all(
      Object.entries(distribution).map(async ([planoId, data]) => {
        if (data.empresaIds.length === 0) {
          return {
            planoId,
            totalEmpresas: data.total,
            empresasAtivas: data.ativas,
            totalUsuarios: 0,
            totalRevenue: 0,
          }
        }

        // Count users (professores + alunos) for this plan's empresas
        const [{ count: profCount }, { count: alunoCount }] = await Promise.all([
          adminClient
            .from("professores")
            .select("*", { count: "exact", head: true })
            .in("empresa_id", data.empresaIds)
            .is("deleted_at", null),
          adminClient
            .from("alunos")
            .select("*", { count: "exact", head: true })
            .in("empresa_id", data.empresaIds)
            .is("deleted_at", null),
        ])

        // Get revenue for last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: transactions } = await adminClient
          .from("transactions")
          .select("amount_cents")
          .in("empresa_id", data.empresaIds)
          .eq("status", "approved")
          .gte("sale_date", thirtyDaysAgo.toISOString())

        const totalRevenue = (transactions || []).reduce(
          (sum, t) => sum + (t.amount_cents || 0),
          0
        )

        return {
          planoId,
          totalEmpresas: data.total,
          empresasAtivas: data.ativas,
          totalUsuarios: (profCount || 0) + (alunoCount || 0),
          totalRevenue,
        }
      })
    )

    // Format distribution for response
    const planoDistribution = PLANOS_CONFIG.map((plano) => {
      const stats = planoStats.find((s) => s.planoId === plano.id)
      return {
        planoId: plano.id,
        name: plano.name,
        count: stats?.totalEmpresas || 0,
        percentage:
          totalEmpresas > 0
            ? Math.round(((stats?.totalEmpresas || 0) / totalEmpresas) * 100)
            : 0,
        priceCents: plano.priceCents,
      }
    })

    // Get recent plan changes (from empresas updated_at where plano might have changed)
    // Note: In a real system, you'd have a plan_history table
    // For now, we'll return empty as we don't have history tracking

    return NextResponse.json({
      data: {
        planos: PLANOS_CONFIG,
        stats: planoStats,
        distribution: planoDistribution,
        totalEmpresas,
        mrr: PLANOS_CONFIG.reduce((sum, plano) => {
          const stats = planoStats.find((s) => s.planoId === plano.id)
          return sum + plano.priceCents * (stats?.empresasAtivas || 0)
        }, 0),
      },
    })
  } catch (error) {
    console.error("Error in superadmin planos endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
