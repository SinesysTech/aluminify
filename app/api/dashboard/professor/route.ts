import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { professorAnalyticsService } from '@/app/[tenant]/(dashboard)/dashboard/services'

/**
 * GET /api/dashboard/professor
 *
 * Retorna dados agregados do dashboard do professor.
 * Para professores que não são admin da empresa.
 *
 * Agrega dados de:
 * - Alunos atendidos
 * - Agendamentos pendentes e realizados
 * - Lista de alunos sob tutela
 * - Próximos agendamentos
 * - Performance dos alunos por disciplina
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id
    const empresaId = request.user?.empresaId

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é professor/usuario
    if (!['professor', 'usuario', 'superadmin'].includes(request.user?.role || '')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas professores podem acessar este dashboard.' },
        { status: 403 }
      )
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não encontrada para o usuário' },
        { status: 400 }
      )
    }

    // Buscar dados agregados do dashboard
    const dashboardData = await professorAnalyticsService.getProfessorDashboard(
      userId,
      empresaId
    )

    return NextResponse.json({ success: true, data: dashboardData })
  } catch (error) {
    console.error('Professor Dashboard API Error:', error)

    let errorMessage = 'Erro ao carregar dados do dashboard'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
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
