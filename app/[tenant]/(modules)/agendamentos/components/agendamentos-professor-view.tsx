import { getAgendamentosProfessor, getAgendamentoStats, getAgendamentosGlobal, getAgendamentoStatsGlobal } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { AgendamentosDashboard } from "./agendamentos-dashboard"
import { Suspense } from "react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"

interface Props {
    userId: string
    empresaId?: string
}

export async function ProfessorAgendamentosView({ userId, empresaId }: Props) {
    const isGlobal = userId === 'all';

    if (isGlobal && !empresaId) {
        return <div>Erro: ID da empresa não fornecido para visão global.</div>
    }

    const [agendamentos, stats] = await Promise.all([
        isGlobal ? getAgendamentosGlobal(empresaId!) : getAgendamentosProfessor(userId),
        isGlobal ? getAgendamentoStatsGlobal(empresaId!) : getAgendamentoStats(userId, empresaId)
    ])

    return (
        <div className="flex flex-col gap-6 p-2 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="page-title">{isGlobal ? "Visão Geral" : "Agendamentos"}</h1>
                <p className="page-subtitle">
                    {isGlobal ? "Gerencie os agendamentos de toda a empresa." : "Gerencie os agendamentos de plantão dos seus alunos."}
                </p>
            </div>

            <Suspense fallback={<AgendamentosSkeleton />}>
                <AgendamentosDashboard
                    agendamentos={agendamentos}
                    stats={stats}
                    professorId={userId}
                />
            </Suspense>
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
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
        </div>
    )
}
