import { SettingsTabs } from '@/components/configuracoes/settings-tabs'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface ConfiguracoesPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const user = await requireUser()
  const { tab } = await searchParams

  // Only empresa admins can access this page
  const allowedRoles = ['professor', 'usuario', 'superadmin']
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard')
  }

  // Must have an associated empresa
  if (!user.empresaId) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <SettingsTabs user={user} initialTab={tab} />
    </div>
  )
}
