import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware'
import { dashboardAnalyticsService } from '@/backend/services/dashboard-analytics'

async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    if (!['aluno', 'professor', 'usuario', 'superadmin'].includes(request.user?.role || '')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas alunos e membros da equipe podem acessar o dashboard.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    const scope = (searchParams.get('scope') || 'curso') as 'curso' | 'disciplina' | 'frente' | 'modulo'
    const scopeId = searchParams.get('scope_id') || undefined
    const period = (searchParams.get('period') || 'anual') as 'semanal' | 'mensal' | 'anual'

    if (!['curso', 'disciplina', 'frente', 'modulo'].includes(scope)) {
      return NextResponse.json({ error: 'scope inválido' }, { status: 400 })
    }
    if (!['semanal', 'mensal', 'anual'].includes(period)) {
      return NextResponse.json({ error: 'period inválido' }, { status: 400 })
    }

    const data = await dashboardAnalyticsService.getStrategicDomainFiltered(userId, {
      scope,
      scopeId,
      period,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Strategic Domain API Error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao carregar domínio estratégico'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const GET = requireAuth(getHandler)

