import dynamic from 'next/dynamic'
import { requireUser } from "@/app/shared/core/auth"

const SettingsTabs = dynamic(() => import("@/app/[tenant]/(modules)/agendamentos/configuracoes/components/settings-tabs").then(mod => mod.SettingsTabs), {
    ssr: false,
})

export default async function EmpresaConfiguracoesPage() {
    const user = await requireUser({ allowedRoles: ["usuario"] })

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="page-title">Configurações da Empresa</h1>
                <p className="page-subtitle">
                    Gerencie dados da empresa, marca e usuários.
                </p>
            </div>

            <SettingsTabs user={user} />
        </div>
    )
}