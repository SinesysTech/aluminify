import type { Metadata } from 'next'
import { ProfessorSelector } from "./components/professor-selector"
import { ProfessorAgendamentosView } from "./components/agendamentos-professor-view"
import { requireUser } from "@/app/shared/core/auth"
import { getProfessoresDisponiveis, getTeachersForAdminSelector } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { isAdminRoleTipo, isTeachingRoleTipo } from "@/app/shared/core/roles"
import { AdminProfessorSelector } from "./components/admin-professor-selector"
import { PlantaoQuotaBanner } from "./components/plantao-quota-banner"
import { resolveEmpresaIdFromTenant } from "@/app/shared/core/resolve-empresa-from-tenant"
import { Suspense } from "react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"

export const metadata: Metadata = {
  title: 'Agendamentos'
}

export default async function AgendamentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant } = await params
  const user = await requireUser()
  const { professorId: searchProfessorId } = await searchParams

  // Always resolve empresa from the current tenant URL to ensure tenant isolation
  const empresaId = await resolveEmpresaIdFromTenant(tenant || '') ?? user.empresaId

  // Student View
  if (user.role === 'aluno') {
    const professors = await getProfessoresDisponiveis(empresaId ?? undefined)

    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 items-center lg:px-10">
          <h1 className="page-title">Agendar Atendimento</h1>
          <p className="page-subtitle text-center px-4 md:px-10">
            Escolha um professor para agendar seu atendimento (plantão, dúvidas, mentoria, etc.).
          </p>
        </div>

        <PlantaoQuotaBanner empresaId={empresaId ?? null} />

        <div>
          <Suspense fallback={<ProfessorSelectorSkeleton />}>
            <ProfessorSelector professores={professors} />
          </Suspense>
        </div>
      </div>
    )
  }

  // Staff/Admin/Professor View
  const isAdmin = user.roleType ? isAdminRoleTipo(user.roleType) : false
  const isTeacher = user.roleType ? isTeachingRoleTipo(user.roleType) : false

  // Admin non-teacher: show admin management view
  if (isAdmin && !isTeacher) {
    if (!user.empresaId) {
      return (
        <div className="flex flex-col gap-6 p-2 md:p-6">
          <div className="flex flex-col gap-2">
            <h1 className="page-title">Agendamentos</h1>
            <p className="page-subtitle">
              Você precisa estar vinculado a uma empresa para gerenciar agendamentos.
            </p>
          </div>
        </div>
      )
    }

    const professorsList = await getTeachersForAdminSelector(user.empresaId)
    const professorId = searchProfessorId && typeof searchProfessorId === "string"
      ? searchProfessorId
      : "all"

    if (!professorId) {
      return (
        <div className="flex flex-col gap-6 p-2 md:p-6">
          <div className="flex flex-col gap-2">
            <h1 className="page-title">Agendamentos</h1>
            <p className="page-subtitle">
              Nenhum professor cadastrado na empresa.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6 p-2 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">
            Gerencie os agendamentos de atendimento dos professores.
          </p>
        </div>

        <AdminProfessorSelector
          professors={professorsList}
          selectedProfessorId={professorId}
          currentUserId={user.id}
          isTeacher={false}
        />

        <Suspense fallback={<AgendamentosSkeleton />}>
          <ProfessorAgendamentosView userId={professorId} empresaId={user.empresaId || undefined} />
        </Suspense>
      </div>
    )
  }

  // Professor (possibly also admin) view
  return <ProfessorAgendamentosView userId={user.id} />
}

function ProfessorSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function AgendamentosSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
