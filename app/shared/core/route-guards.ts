import { redirect } from 'next/navigation'
import { requireUser } from './auth'
import { getDefaultRouteForRole, canImpersonate } from './roles'
import { getImpersonationContext } from './auth-impersonate'

/**
 * Guard para rotas de aluno
 * Permite acesso se for aluno ou se estiver em modo impersonação
 */
export async function requireAlunoRoute() {
  const user = await requireUser()
  const impersonationContext = await getImpersonationContext()

  // Se estiver impersonando e o usuário impersonado é aluno, permitir
  if (impersonationContext && impersonationContext.impersonatedUserRole === 'aluno') {
    return user
  }

  // Se for aluno real, permitir
  if (user.role === 'aluno') {
    return user
  }

  // Caso contrário, redirecionar
  const defaultRoute = getDefaultRouteForRole(user.role)
  const redirectUrl = user.empresaSlug
    ? `/${user.empresaSlug}${defaultRoute}`
    : defaultRoute
  redirect(redirectUrl)
}

/**
 * Guard para rotas de professor
 */
export async function requireProfessorRoute() {
  const user = await requireUser({ allowedRoles: ['professor'] })
  return user
}

/**
 * Guard para rotas de staff (usuario)
 */
export async function requireUsuarioRoute() {
  const user = await requireUser({ allowedRoles: ['usuario'] })
  return user
}

/**
 * Permite acesso se o usuário pode impersonar ou se está em modo impersonação
 */
export async function allowImpersonation() {
  const user = await requireUser()
  const impersonationContext = await getImpersonationContext()

  // Se estiver em modo impersonação, permitir
  if (impersonationContext) {
    return user
  }

  // Se pode impersonar, permitir
  if (canImpersonate(user.role)) {
    return user
  }

  // Caso contrário, redirecionar
  const defaultRoute = getDefaultRouteForRole(user.role)
  const redirectUrl = user.empresaSlug
    ? `/${user.empresaSlug}${defaultRoute}`
    : defaultRoute
  redirect(redirectUrl)
}

/**
 * Verifica se a rota atual permite impersonação
 */
export function routeAllowsImpersonation(pathname: string): boolean {
  // Rotas de aluno permitem impersonação
  return pathname.startsWith('/aluno/')
}



