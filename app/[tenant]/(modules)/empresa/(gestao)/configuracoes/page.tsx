
import { createClient } from "@/app/shared/core/server"
import { redirect } from "next/navigation"
import { SettingsTabs } from "@/app/[tenant]/(modules)/agendamentos/configuracoes/components/settings-tabs"

export default async function EmpresaConfiguracoesPage() {
    const supabase = await createClient()
    const {
      data: { user },
      // @ts-expect-error - auth property check
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Fetch basic user info to pass to SettingsTabs if needed (it takes 'user' prop)
    // We need to type cast or fetch full user profile if 'user' from auth isn't enough.
    // SettingsTabs expects 'AppUser'. Let's check if we need to fetch profile.
    // For now passing auth user casted or ensure type compatibility.
    // Actually SettingsTabs takes 'AppUser'. 

    // Let's implement a minimal fetch or usage.

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="page-title">Configurações da Empresa</h1>
                <p className="page-subtitle">
                    Gerencie dados da empresa, marca e usuários.
                </p>
            </div>

            <SettingsTabs user={user as any} />
        </div>
    )
}
