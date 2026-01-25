import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { dashboardAnalyticsService } from '@/app/[tenant]/(dashboard)/dashboard/services'

async function getHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.id
    if (!userId) return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })

    if (!['aluno', 'professor', 'usuario', 'superadmin'].includes(request.user?.role || '')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas alunos e membros da equipe podem acessar o dashboard.' },
        { status: 403 }
      )
    }

    const data = await dashboardAnalyticsService.getAvailableCourses(userId)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dashboard Courses API Error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao carregar cursos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const GET = requireAuth(getHandler)

