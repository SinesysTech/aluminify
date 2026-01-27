import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"

/**
 * GET /api/superadmin/financeiro
 * Retorna dados financeiros globais agregados (apenas superadmin)
 *
 * Query params:
 * - dateFrom: filtro de data inicial (ISO string)
 * - dateTo: filtro de data final (ISO string)
 * - empresaId: filtro por empresa específica
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
    const dateFromParam = searchParams.get("dateFrom")
    const dateToParam = searchParams.get("dateTo")
    const empresaIdParam = searchParams.get("empresaId")

    const adminClient = getDatabaseClient()

    // Build base query for transactions
    let transactionsQuery = adminClient
      .from("transactions")
      .select(`
        id,
        empresa_id,
        amount_cents,
        status,
        payment_method,
        provider,
        buyer_email,
        buyer_name,
        sale_date,
        created_at
      `)

    // Apply date filters
    if (dateFromParam) {
      transactionsQuery = transactionsQuery.gte("sale_date", dateFromParam)
    }
    if (dateToParam) {
      transactionsQuery = transactionsQuery.lte("sale_date", dateToParam)
    }
    if (empresaIdParam && empresaIdParam !== "all") {
      transactionsQuery = transactionsQuery.eq("empresa_id", empresaIdParam)
    }

    const { data: transactions, error: transactionsError } = await transactionsQuery

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json(
        { error: "Erro ao buscar transações" },
        { status: 500 }
      )
    }

    // Get empresas for mapping
    const { data: empresas } = await adminClient
      .from("empresas")
      .select("id, nome, slug, plano")
      .is("deleted_at", null)

    const empresaMap = new Map(
      (empresas || []).map((e) => [e.id, { nome: e.nome, slug: e.slug, plano: e.plano }])
    )

    // Calculate stats
    const allTransactions = transactions || []
    const approvedTransactions = allTransactions.filter((t) => t.status === "approved")

    const totalRevenueCents = approvedTransactions.reduce(
      (sum, t) => sum + (t.amount_cents || 0),
      0
    )
    const totalTransactions = allTransactions.length
    const averageTicketCents =
      approvedTransactions.length > 0
        ? Math.round(totalRevenueCents / approvedTransactions.length)
        : 0

    // MRR - last 30 days approved revenue
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const mrrTransactions = approvedTransactions.filter(
      (t) => new Date(t.sale_date) >= thirtyDaysAgo
    )
    const mrrCents = mrrTransactions.reduce((sum, t) => sum + (t.amount_cents || 0), 0)

    // Growth calculation (current 30 days vs previous 30 days)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const prevPeriodTransactions = approvedTransactions.filter((t) => {
      const saleDate = new Date(t.sale_date)
      return saleDate >= sixtyDaysAgo && saleDate < thirtyDaysAgo
    })
    const prevRevenue = prevPeriodTransactions.reduce(
      (sum, t) => sum + (t.amount_cents || 0),
      0
    )

    const revenueGrowthPercent =
      prevRevenue > 0
        ? Math.round(((mrrCents - prevRevenue) / prevRevenue) * 100)
        : mrrCents > 0
          ? 100
          : 0

    const transactionGrowthPercent =
      prevPeriodTransactions.length > 0
        ? Math.round(
            ((mrrTransactions.length - prevPeriodTransactions.length) /
              prevPeriodTransactions.length) *
              100
          )
        : mrrTransactions.length > 0
          ? 100
          : 0

    // By status
    const byStatus: Record<string, { count: number; amountCents: number }> = {}
    allTransactions.forEach((t) => {
      const status = t.status || "pending"
      if (!byStatus[status]) {
        byStatus[status] = { count: 0, amountCents: 0 }
      }
      byStatus[status].count++
      byStatus[status].amountCents += t.amount_cents || 0
    })

    // By payment method
    const byPaymentMethod: Record<string, { count: number; amountCents: number }> = {}
    approvedTransactions.forEach((t) => {
      const method = t.payment_method || "other"
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, amountCents: 0 }
      }
      byPaymentMethod[method].count++
      byPaymentMethod[method].amountCents += t.amount_cents || 0
    })

    // Revenue by empresa
    const revenueByEmpresaMap = new Map<
      string,
      { totalRevenueCents: number; totalTransactions: number; lastTransactionDate: string | null }
    >()

    approvedTransactions.forEach((t) => {
      const empresaId = t.empresa_id
      if (!empresaId) return

      const current = revenueByEmpresaMap.get(empresaId) || {
        totalRevenueCents: 0,
        totalTransactions: 0,
        lastTransactionDate: null,
      }

      current.totalRevenueCents += t.amount_cents || 0
      current.totalTransactions++

      const saleDate = t.sale_date
      if (!current.lastTransactionDate || saleDate > current.lastTransactionDate) {
        current.lastTransactionDate = saleDate
      }

      revenueByEmpresaMap.set(empresaId, current)
    })

    const revenueByEmpresa = Array.from(revenueByEmpresaMap.entries())
      .map(([empresaId, data]) => {
        const empresa = empresaMap.get(empresaId)
        return {
          empresaId,
          empresaNome: empresa?.nome || "Empresa removida",
          empresaSlug: empresa?.slug || "",
          plano: empresa?.plano || "basico",
          ...data,
        }
      })
      .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)

    // Monthly revenue (last 6 months)
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(date.toISOString().slice(0, 7))
    }

    const monthlyRevenue = months.map((month) => {
      const monthStart = new Date(month + "-01")
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const monthTransactions = approvedTransactions.filter((t) => {
        const saleDate = new Date(t.sale_date)
        return saleDate >= monthStart && saleDate < monthEnd
      })

      const monthNames = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez",
      ]

      return {
        month: monthNames[monthStart.getMonth()],
        revenueCents: monthTransactions.reduce((sum, t) => sum + (t.amount_cents || 0), 0),
        transactionCount: monthTransactions.length,
      }
    })

    // Recent transactions (last 10)
    const recentTransactions = allTransactions
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
      .slice(0, 10)
      .map((t) => {
        const empresa = empresaMap.get(t.empresa_id)
        return {
          id: t.id,
          empresaId: t.empresa_id,
          empresaNome: empresa?.nome || "Empresa removida",
          buyerEmail: t.buyer_email,
          buyerName: t.buyer_name,
          amountCents: t.amount_cents,
          status: t.status,
          paymentMethod: t.payment_method,
          provider: t.provider,
          saleDate: t.sale_date,
        }
      })

    return NextResponse.json({
      data: {
        stats: {
          totalRevenueCents,
          totalTransactions,
          averageTicketCents,
          mrrCents,
          revenueGrowthPercent,
          transactionGrowthPercent,
          byStatus,
          byPaymentMethod,
        },
        revenueByEmpresa,
        monthlyRevenue,
        recentTransactions,
      },
    })
  } catch (error) {
    console.error("Error in superadmin financeiro endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
