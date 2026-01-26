
import { IntegracaoManager } from "@/app/[tenant]/(modules)/agendamentos/configuracoes/components/integracao-manager"
import { requireUser } from "@/app/shared/core/auth"

export default async function IntegracoesPage() {
  const user = await requireUser({ allowedRoles: ["usuario"] })

  if (!user.empresaId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Integrações</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para gerenciar integrações.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Integrações</h1>
        <p className="page-subtitle">
          Gerencie suas conexões com calendar e videoconferência.
        </p>
      </div>

      <IntegracaoManager professorId={user.id} />
    </div>
  )
}
