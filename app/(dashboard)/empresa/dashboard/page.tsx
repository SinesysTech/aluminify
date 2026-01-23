import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

/**
 * Legacy empresa dashboard page.
 * Redirects to the professor dashboard since the 'empresa' role
 * has been migrated to 'usuario' with appropriate roleType.
 */
export default async function EmpresaDashboardRedirectPage() {
  const user = await requireUser({ allowedRoles: ['usuario', 'superadmin'] })

  if (user.empresaSlug) {
    redirect(`/${user.empresaSlug}/professor/dashboard`)
  }

  // Fallback to generic professor dashboard
  redirect('/professor/dashboard')
}
