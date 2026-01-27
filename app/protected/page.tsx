import { redirect } from 'next/navigation'

import { getAuthenticatedUser } from '@/app/shared/core/auth'
import { getDefaultRouteForRole } from '@/app/shared/core/roles'

export const dynamic = 'force-dynamic'

export default async function ProtectedPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth')
  }

  if (user.mustChangePassword) {
    redirect('/primeiro-acesso')
  }

  const defaultRoute = getDefaultRouteForRole(user.role)
  const redirectUrl = user.empresaSlug && user.role !== 'superadmin'
    ? `/${user.empresaSlug}${defaultRoute}`
    : defaultRoute
  redirect(redirectUrl)
}
