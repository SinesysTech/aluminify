import { requireUser } from '@/app/shared/core/auth'
import { redirect } from 'next/navigation'
import { isAdminRoleTipo } from '@/app/shared/core/roles'
import { NovoPapelClient } from './novo-papel-client'

export default async function NovoPapelPage() {
  const user = await requireUser()

  // Only admins can access this page
  const isAdmin = user.role === 'superadmin' || (user.roleType && isAdminRoleTipo(user.roleType))
  if (!isAdmin) {
    redirect('/dashboard')
  }

  if (!user.empresaId) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <NovoPapelClient empresaId={user.empresaId} />
    </div>
  )
}
