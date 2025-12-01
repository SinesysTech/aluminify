import { ProfileSettings } from '@/components/profile-settings'
import { requireUser } from '@/lib/auth'

export default async function PerfilPage() {
  const user = await requireUser()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Meu perfil</h1>
        <p className="text-muted-foreground">
          Ajuste seus dados pessoais, senha e prepare seu avatar.
        </p>
      </div>
      <ProfileSettings user={user} />
    </div>
  )
}












