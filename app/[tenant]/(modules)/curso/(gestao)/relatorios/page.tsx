
import { requireUser } from "@/app/shared/core/auth"
import { RelatoriosDashboard } from "../../components/relatorios-dashboard"

export default async function RelatoriosPage() {
  const user = await requireUser({ allowedRoles: ["usuario"] })

  if (!user.empresaId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para visualizar os relatórios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Relatórios de Desempenho</h1>
        <p className="page-subtitle">
          Acompanhe os indicadores das suas mentorias.
        </p>
      </div>

      <RelatoriosDashboard empresaId={user.empresaId} />
    </div>
  )
}
