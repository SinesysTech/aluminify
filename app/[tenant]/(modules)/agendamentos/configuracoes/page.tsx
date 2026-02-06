
import { getConfiguracoesProfessor, getTeachersForAdminSelector } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { ConfiguracoesForm } from "./components/configuracoes-form"
import { AdminProfessorSelector } from "@/app/[tenant]/(modules)/agendamentos/components/admin-professor-selector"
import { requireUser } from "@/app/shared/core/auth"
import { isTeachingRole } from "@/app/shared/core/roles"

export default async function ProfessorConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireUser({ allowedRoles: ["usuario"] })
  const { professorId: searchProfessorId } = await searchParams

  if (!user.empresaId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  const isAdmin = user.isAdmin
  const isTeacher = isTeachingRole(user.role)

  let professorId = user.id
  let professorsList: { id: string; fullName: string }[] = []

  if (isAdmin) {
    professorsList = await getTeachersForAdminSelector(user.empresaId)

    if (searchProfessorId && typeof searchProfessorId === "string") {
      professorId = searchProfessorId
    } else if (!isTeacher && professorsList.length > 0) {
      professorId = professorsList[0].id
    }
  }

  if (!isAdmin && !isTeacher) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">
            Você não tem permissão para acessar configurações de agendamento.
          </p>
        </div>
      </div>
    )
  }

  const configuracoes = await getConfiguracoesProfessor(professorId)
  const selectedProfessorName = professorsList.find(p => p.id === professorId)?.fullName

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Configurações de Agendamento</h1>
        <p className="page-subtitle">
          {isAdmin && professorId !== user.id
            ? `Configure as preferências de agendamento de ${selectedProfessorName || "professor selecionado"}.`
            : "Configure suas preferências para agendamentos de plantão."}
        </p>
      </div>

      {isAdmin && (
        <AdminProfessorSelector
          professors={professorsList}
          selectedProfessorId={professorId}
          currentUserId={user.id}
          isTeacher={isTeacher}
        />
      )}

      <ConfiguracoesForm
        professorId={professorId}
        initialData={configuracoes}
      />
    </div>
  )
}
