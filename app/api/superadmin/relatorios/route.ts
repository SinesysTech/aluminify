import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"

/**
 * GET /api/superadmin/relatorios
 * Retorna dados agregados para relatórios globais (apenas superadmin)
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

    // Get current totals
    const [
      { count: totalEmpresas },
      { count: totalProfessores },
      { count: totalAlunos },
      { count: totalCursos },
    ] = await Promise.all([
      adminClient
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      adminClient
        .from("professores")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      adminClient
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      adminClient
        .from("cursos")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ])

    // Get growth data - last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [empresasData, professoresData, alunosData] = await Promise.all([
      adminClient
        .from("empresas")
        .select("created_at")
        .is("deleted_at", null)
        .gte("created_at", sixMonthsAgo.toISOString()),
      adminClient
        .from("professores")
        .select("created_at")
        .is("deleted_at", null)
        .gte("created_at", sixMonthsAgo.toISOString()),
      adminClient
        .from("alunos")
        .select("created_at")
        .is("deleted_at", null)
        .gte("created_at", sixMonthsAgo.toISOString()),
    ])

    // Aggregate by month
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(date.toISOString().slice(0, 7)) // YYYY-MM format
    }

    const growthData = months.map((month) => {
      const monthStart = new Date(month + "-01")
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const countInMonth = (
        data: { data: Array<{ created_at: string }> | null }
      ) => {
        return (data.data || []).filter((item) => {
          const createdAt = new Date(item.created_at)
          return createdAt >= monthStart && createdAt < monthEnd
        }).length
      }

      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ]

      return {
        month: monthNames[monthStart.getMonth()],
        empresas: countInMonth(empresasData),
        professores: countInMonth(professoresData),
        alunos: countInMonth(alunosData),
      }
    })

    // Get plan distribution
    const { data: empresasByPlan } = await adminClient
      .from("empresas")
      .select("plano")
      .is("deleted_at", null)

    const planCounts: Record<string, number> = {}
    ;(empresasByPlan || []).forEach((e) => {
      const plano = e.plano || "basico"
      planCounts[plano] = (planCounts[plano] || 0) + 1
    })

    const total = Object.values(planCounts).reduce((a, b) => a + b, 0)
    const planDistribution = Object.entries(planCounts).map(([plano, count]) => ({
      plano: plano.charAt(0).toUpperCase() + plano.slice(1),
      total: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

    // Get top empresas by users
    const { data: empresas } = await adminClient
      .from("empresas")
      .select(
        `
        id,
        nome,
        slug,
        plano
      `
      )
      .is("deleted_at", null)
      .limit(10)

    const topEmpresas = await Promise.all(
      (empresas || []).map(async (empresa) => {
        const [{ count: totalProfessoresEmpresa }, { count: totalAlunosEmpresa }, { count: totalCursosEmpresa }] =
          await Promise.all([
            adminClient
              .from("professores")
              .select("*", { count: "exact", head: true })
              .eq("empresa_id", empresa.id)
              .is("deleted_at", null),
            adminClient
              .from("alunos")
              .select("*", { count: "exact", head: true })
              .eq("empresa_id", empresa.id)
              .is("deleted_at", null),
            adminClient
              .from("cursos")
              .select("*", { count: "exact", head: true })
              .eq("empresa_id", empresa.id)
              .is("deleted_at", null),
          ])

        return {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          totalUsuarios: (totalProfessoresEmpresa || 0) + (totalAlunosEmpresa || 0),
          totalCursos: totalCursosEmpresa || 0,
          plano: empresa.plano || "basico",
        }
      })
    )

    // Sort by total users
    topEmpresas.sort((a, b) => b.totalUsuarios - a.totalUsuarios)

    // Calculate growth rates (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const [
      { count: empresasLast30 },
      { count: empresasPrev30 },
      { count: usersLast30 },
      { count: usersPrev30 },
    ] = await Promise.all([
      adminClient
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null),
      adminClient
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null),
      adminClient
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null),
      adminClient
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null),
    ])

    const crescimentoEmpresas =
      empresasPrev30 && empresasPrev30 > 0
        ? Math.round(((empresasLast30! - empresasPrev30) / empresasPrev30) * 100)
        : empresasLast30 && empresasLast30 > 0
          ? 100
          : 0

    const crescimentoUsuarios =
      usersPrev30 && usersPrev30 > 0
        ? Math.round(((usersLast30! - usersPrev30) / usersPrev30) * 100)
        : usersLast30 && usersLast30 > 0
          ? 100
          : 0

    return NextResponse.json({
      data: {
        growthData,
        planDistribution,
        topEmpresas: topEmpresas.slice(0, 5),
        summary: {
          totalEmpresas: totalEmpresas || 0,
          totalProfessores: totalProfessores || 0,
          totalAlunos: totalAlunos || 0,
          totalCursos: totalCursos || 0,
          crescimentoEmpresas,
          crescimentoUsuarios,
        },
      },
    })
  } catch (error) {
    console.error("Error in superadmin relatorios endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
