import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { dashboardAnalyticsService } from '@/app/[tenant]/(dashboard)/dashboard/services'

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

    const groupBy = (searchParams.get('group_by') || 'disciplina') as 'curso' | 'disciplina' | 'frente' | 'modulo'
    const scope = (searchParams.get('scope') || 'curso') as 'curso' | 'disciplina' | 'frente' | 'modulo'
    const scopeId = searchParams.get('scope_id') || undefined
    const period = (searchParams.get('period') || 'mensal') as 'semanal' | 'mensal' | 'anual'

    if (!['curso', 'disciplina', 'frente', 'modulo'].includes(groupBy)) {
      return NextResponse.json({ error: 'group_by inválido' }, { status: 400 })
    }
    if (!['curso', 'disciplina', 'frente', 'modulo'].includes(scope)) {
      return NextResponse.json({ error: 'scope inválido' }, { status: 400 })
    }
    if (!['semanal', 'mensal', 'anual'].includes(period)) {
      return NextResponse.json({ error: 'period inválido' }, { status: 400 })
    }

    const data = await dashboardAnalyticsService.getSubjectDistributionFiltered(userId, {
      groupBy,
      scope,
      scopeId,
      period,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Subject Distribution API Error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao carregar distribuição'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const GET = requireAuth(getHandler)

