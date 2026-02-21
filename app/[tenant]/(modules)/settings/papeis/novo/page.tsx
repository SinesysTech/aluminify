import { requireUser } from '@/app/shared/core/auth'
import { redirect } from 'next/navigation'
import { NovoPapelClient } from './novo-papel-client'

export default async function NovoPapelPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const user = await requireUser()
  const { tenant } = await params

  // Only admins can access this page
  if (!user.isAdmin) {
    redirect(`/${tenant}/dashboard`)
  }

  if (!user.empresaId) {
    redirect(`/${tenant}/dashboard`)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
      <NovoPapelClient empresaId={user.empresaId} />
      </div>
    </div>
  )
}
