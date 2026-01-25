import { NextResponse } from 'next/server'
import { requireUserAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { dashboardAnalyticsService } from '@/backend/services/dashboard-analytics'

/**
 * GET /api/dashboard/analytics
 *
 * Retorna dados agregados do dashboard analytics do aluno.
 * Suporta modo de impersonação: quando um admin/professor está visualizando
 * como aluno, usa o ID do aluno impersonado.
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
    const realUserId = request.user?.id

    if (!realUserId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Permitir acesso para alunos e membros da equipe (professor/usuario)
    if (!['aluno', 'professor', 'usuario', 'superadmin'].includes(request.user?.role || '')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas alunos e membros da equipe podem acessar o dashboard.' },
        { status: 403 }
      )
    }

    // Verificar contexto de impersonação
    // Se estiver impersonando um aluno, usar o ID do aluno impersonado
    const impersonationContext = request.impersonationContext
    const targetUserId = impersonationContext?.impersonatedUserId || realUserId

    // Obter parâmetros
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'anual') as 'semanal' | 'mensal' | 'anual'
    const empresaId = searchParams.get('empresa_id') || undefined

    // Validar período
    if (!['semanal', 'mensal', 'anual'].includes(period)) {
      return NextResponse.json(
        { error: 'Período inválido. Use: semanal, mensal ou anual' },
        { status: 400 }
      )
    }

    // Buscar dados agregados do dashboard (usa ID do aluno impersonado se aplicável)
    // Se empresa_id for passado, filtra apenas cursos dessa organização (para alunos multi-org)
    const dashboardData = await dashboardAnalyticsService.getDashboardData(targetUserId, {
      period,
      empresaId,
    })

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

export const GET = requireUserAuth(getHandler)

