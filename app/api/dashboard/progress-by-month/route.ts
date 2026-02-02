import { NextResponse } from "next/server"
import { requireUserAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware"
import { dashboardAnalyticsService } from "@/app/[tenant]/(modules)/dashboard/services"

export const dynamic = "force-dynamic"

async function getHandler(request: AuthenticatedRequest) {
  try {
    const realUserId = request.user?.id
    if (!realUserId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    if (!["aluno", "professor", "usuario"].includes(request.user?.role || "")) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const impersonationContext = request.impersonationContext
    const targetUserId = impersonationContext?.impersonatedUserId || realUserId

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || undefined

    const data = await dashboardAnalyticsService.getProgressByMonth(targetUserId, empresaId)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard Progress By Month API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar progresso mensal" },
      { status: 500 },
    )
  }
}

export const GET = requireUserAuth(getHandler)
