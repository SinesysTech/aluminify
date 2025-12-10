import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware'
import { dashboardAnalyticsService } from '@/backend/services/dashboard-analytics'

/**
 * GET /api/dashboard/analytics
 * 
 * Retorna dados agregados do dashboard analytics do aluno.
 * 
 * Agrega dados de:
 * - Progresso de atividades (progresso_atividades)
 * - Sessões de estudo (sessoes_estudo)
 * - Cronograma (cronogramas)
 * - Flashcards revisados (atividades tipo Flashcards)
 * - Performance por disciplina/frente
 * - Heatmap de constância (365 dias)
 * - Eficiência de foco (por dia da semana)
 * - Distribuição por disciplina
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Permitir acesso para alunos, professores e superadmins
    if (!['aluno', 'professor', 'superadmin'].includes(request.user?.role || '')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas alunos, professores e superadmins podem acessar o dashboard.' },
        { status: 403 }
      )
    }

    // Buscar dados agregados do dashboard
    const dashboardData = await dashboardAnalyticsService.getDashboardData(userId)

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error('Dashboard Analytics API Error:', error)

    let errorMessage = 'Erro ao carregar dados do dashboard'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getHandler)

