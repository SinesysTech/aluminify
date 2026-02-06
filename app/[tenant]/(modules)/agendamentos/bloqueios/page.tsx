
import { BloqueiosManager } from "./components/bloqueios-manager"
import { requireUser } from "@/app/shared/core/auth"
import { isTeachingRole } from "@/app/shared/core/roles"
import { getTeachersForAdminSelector } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { AdminProfessorSelector } from "@/app/[tenant]/(modules)/agendamentos/components/admin-professor-selector"

export default async function BloqueiosPage({
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
          <h1 className="page-title">Bloqueios</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para gerenciar bloqueios.
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
          <h1 className="page-title">Bloqueios</h1>
          <p className="page-subtitle">
            Você não tem permissão para gerenciar bloqueios de agenda.
          </p>
        </div>
      </div>
    )
  }

  const selectedProfessorName = professorsList.find(p => p.id === professorId)?.fullName

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Bloqueios de Agenda</h1>
        <p className="page-subtitle">
          {isAdmin && professorId !== user.id
            ? `Gerencie períodos de indisponibilidade de ${selectedProfessorName || "professor selecionado"}.`
            : "Gerencie períodos de indisponibilidade como feriados, recessos e imprevistos."}
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

      <BloqueiosManager
        professorId={professorId}
        empresaId={user.empresaId}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}
