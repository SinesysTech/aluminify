'use client'

import * as React from 'react'
import { AlertCircle, School } from 'lucide-react'
import { Skeleton } from '@/app/shared/components/feedback/skeleton'
import { useCurrentUser } from '@/components/providers/user-provider'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import {
  AtividadeComProgresso,
  CursoComDisciplinas,
  DisciplinaComFrentes,
} from './types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { salaEstudosService } from './services/sala-estudos.service'

// New components
import { StudyRoomHeader } from './components/study-room-header'
import { ProgressoStatsCard } from './components/progresso-stats-card'
import { NextActivityCard } from './components/next-activity-card'
import { DisciplineTabs } from './components/discipline-tabs'
import { FrenteCardGrid } from './components/frente-card-grid'

export default function SalaEstudosClientPage() {
  const currentUser = useCurrentUser()
  const { activeOrganization } = useStudentOrganizations()
  const activeOrgId = activeOrganization?.id

  // Data state
  const [atividades, setAtividades] = React.useState<AtividadeComProgresso[]>([])
  const [estruturaHierarquica, setEstruturaHierarquica] = React.useState<CursoComDisciplinas[]>([])

  // UI state
  const [activeDisciplinaId, setActiveDisciplinaId] = React.useState<string | null>(null)
  const [expandedFrenteId, setExpandedFrenteId] = React.useState<string | null>(null)

  // Loading/Error state
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Engagement data (would come from API in production)
  const [streakDays] = React.useState(0) // TODO: fetch from dashboard analytics service

  const isReadOnlyImpersonation = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((currentUser as any)?._impersonationContext)
  }, [currentUser])

  // Initial Data Load
  React.useEffect(() => {
    const fetchData = async () => {
      if (!currentUser.id || !currentUser.role) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await salaEstudosService.getInitialData(
          currentUser.id,
          currentUser.role,
          activeOrgId
        )
        setAtividades(data.atividades)
        setEstruturaHierarquica(data.estrutura)

        // Auto-select first discipline if available
        const firstDisciplina = data.estrutura
          .flatMap((c) => c.disciplinas)
          .find((d) => d.frentes.length > 0)
        if (firstDisciplina) {
          setActiveDisciplinaId(firstDisciplina.id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser.id, currentUser.role, activeOrgId])

  // Handlers
  const handleStatusChange = async (atividadeId: string, status: StatusAtividade) => {
    if (isReadOnlyImpersonation) return

    // Optimistic update
    setAtividades((prev) =>
      prev.map((a) => (a.id === atividadeId ? { ...a, progressoStatus: status } : a))
    )

    try {
      await salaEstudosService.updateStatus(atividadeId, status)
    } catch (error) {
      console.error('Falha ao atualizar status:', error)
      // Could implement rollback here
    }
  }

  const handleStatusChangeWithDesempenho = async (
    atividadeId: string,
    status: StatusAtividade,
    desempenho: {
      questoesTotais: number
      questoesAcertos: number
      dificuldadePercebida: DificuldadePercebida
      anotacoesPessoais?: string | null
    }
  ) => {
    if (isReadOnlyImpersonation) return

    // Optimistic Update
    setAtividades((prev) =>
      prev.map((a) =>
        a.id === atividadeId
          ? {
              ...a,
              progressoStatus: status,
              questoesTotais: desempenho.questoesTotais,
              questoesAcertos: desempenho.questoesAcertos,
              dificuldadePercebida: desempenho.dificuldadePercebida,
              anotacoesPessoais: desempenho.anotacoesPessoais,
            }
          : a
      )
    )

    try {
      await salaEstudosService.updateDesempenho(atividadeId, status, desempenho)
    } catch (error) {
      console.error('Falha ao registrar desempenho:', error)
    }
  }

  const handleFrenteToggle = (frenteId: string) => {
    setExpandedFrenteId((prev) => (prev === frenteId ? null : frenteId))
  }

  // Derived data
  const allDisciplinas = React.useMemo(() => {
    return estruturaHierarquica.flatMap((c) => c.disciplinas)
  }, [estruturaHierarquica])

  const currentDisciplina = React.useMemo(() => {
    return allDisciplinas.find((d) => d.id === activeDisciplinaId)
  }, [allDisciplinas, activeDisciplinaId])

  const disciplinaStats = React.useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>()
    allDisciplinas.forEach((d: DisciplinaComFrentes) => {
      const disciplinaAtividades = atividades.filter((a) => a.disciplinaId === d.id)
      const completed = disciplinaAtividades.filter(
        (a) => a.progressoStatus === 'Concluido'
      ).length
      map.set(d.id, { completed, total: disciplinaAtividades.length })
    })
    return map
  }, [allDisciplinas, atividades])

  const frenteStats = React.useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>()
    atividades.forEach((a) => {
      const current = map.get(a.frenteId) || { completed: 0, total: 0 }
      current.total++
      if (a.progressoStatus === 'Concluido') current.completed++
      map.set(a.frenteId, current)
    })
    return map
  }, [atividades])

  const nextActivity = React.useMemo(() => {
    return atividades.find((a) => a.progressoStatus !== 'Concluido')
  }, [atividades])

  const dailyGoal = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const completedToday = atividades.filter((a) => {
      if (a.progressoStatus !== 'Concluido' || !a.progressoDataConclusao) return false
      return a.progressoDataConclusao.startsWith(today)
    }).length
    return { completed: completedToday, target: 3 }
  }, [atividades])

  const currentFrentes = React.useMemo(() => {
    return currentDisciplina?.frentes || []
  }, [currentDisciplina])

  const currentAtividades = React.useMemo(() => {
    if (!activeDisciplinaId) return []
    return atividades.filter((a) => a.disciplinaId === activeDisciplinaId)
  }, [atividades, activeDisciplinaId])

  return (
    <div className="space-y-6">
      {/* Header with greeting, streak, and org switcher */}
      <StudyRoomHeader
        userName={currentUser.name || 'Estudante'}
        streakDays={streakDays}
      />

      {/* Impersonation Warning */}
      {isReadOnlyImpersonation && (
        <div className="rounded-md bg-amber-500/10 p-4 text-amber-500 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>
            Modo de visualizacao (Impersonacao): Voce esta vendo os dados do aluno como somente
            leitura. Alteracoes de status nao serao salvas.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <ProgressoStatsCard
            atividades={atividades}
            streakDays={streakDays}
            dailyGoal={dailyGoal}
          />

          {/* Next Activity Card */}
          <NextActivityCard activity={nextActivity} />

          {/* Content Area */}
          {allDisciplinas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <School className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Nenhuma atividade encontrada</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                Voce ainda nao possui atividades disponiveis. Entre em contato com a coordenacao.
              </p>
            </div>
          ) : (
            <DisciplineTabs
              disciplinas={allDisciplinas}
              activeDisciplinaId={activeDisciplinaId}
              onDisciplinaChange={(id) => {
                setActiveDisciplinaId(id)
                setExpandedFrenteId(null) // Reset expanded frente when changing discipline
              }}
              stats={disciplinaStats}
            >
              <FrenteCardGrid
                frentes={currentFrentes}
                frenteStats={frenteStats}
                atividades={currentAtividades}
                expandedFrenteId={expandedFrenteId}
                onFrenteToggle={handleFrenteToggle}
                onStatusChange={isReadOnlyImpersonation ? undefined : handleStatusChange}
                onStatusChangeWithDesempenho={
                  isReadOnlyImpersonation ? undefined : handleStatusChangeWithDesempenho
                }
              />
            </DisciplineTabs>
          )}
        </>
      )}
    </div>
  )
}
