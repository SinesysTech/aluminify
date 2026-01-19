import { ProfileTabs } from '@/components/perfil/profile-tabs'
import { requireUser } from '@/lib/auth'

export default async function PerfilPage() {
  const user = await requireUser()

  return (
    <div className="container mx-auto py-6">
      <ProfileTabs user={user} />
    </div>
  )
}

