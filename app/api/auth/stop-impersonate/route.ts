import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { clearImpersonationContext, getImpersonationContext } from '@/lib/auth-impersonate'
import { getDefaultRouteForRole } from '@/lib/roles'

async function postHandler(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se está realmente em modo impersonação
    const context = await getImpersonationContext()
    if (!context) {
      return NextResponse.json(
        { error: 'Não está em modo impersonação' },
        { status: 400 }
      )
    }

    // Verificar se o usuário real corresponde
    if (context.realUserId !== request.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Limpar contexto
    await clearImpersonationContext()

    return NextResponse.json({
      success: true,
      redirectTo: getDefaultRouteForRole(context.realUserRole),
    })
  } catch (error) {
    console.error('Erro ao parar impersonação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = requireUserAuth(postHandler)



