'use client'

import * as React from 'react'
import { AlertCircle, School } from 'lucide-react'
import { Skeleton } from '@/app/shared/components/feedback/skeleton'
import { SalaEstudosFilters } from './components/sala-estudos-filters'
import { ModuloActivitiesAccordion } from './components/modulo-activities-accordion'
import { ProgressoStatsCard } from './components/progresso-stats-card'
import { useCurrentUser } from '@/components/providers/user-provider'
import { OrganizationSwitcher } from '@/app/[tenant]/(modules)/dashboard/components/organization-switcher'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import {
    AtividadeComProgresso,
    CursoComDisciplinas,
    DisciplinaComFrentes,
    FrenteComModulos,
    ModuloComAtividades,
} from './types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { salaEstudosService } from './services/sala-estudos.service'

type SalaEstudosClientProps = {
    title?: string
    description?: string
}

export default function SalaEstudosClientPage({
    title = 'Sala de Estudos',
    description = 'Checklist e acompanhamento do seu progresso nas atividades',
}: SalaEstudosClientProps) {
    const currentUser = useCurrentUser()
    const { activeOrganization } = useStudentOrganizations()
    const activeOrgId = activeOrganization?.id

    const [atividades, setAtividades] = React.useState<AtividadeComProgresso[]>([])
    const [cursos, setCursos] = React.useState<Array<{ id: string; nome: string }>>([])

    // Filter states
    const [disciplinas, setDisciplinas] = React.useState<Array<{ id: string; nome: string }>>([])
    const [frentes, setFrentes] = React.useState<Array<{ id: string; nome: string; disciplina_id: string }>>([])
    const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
    const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
    const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')

    const [isLoadingAtividades, setIsLoadingAtividades] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [estruturaHierarquica, setEstruturaHierarquica] = React.useState<CursoComDisciplinas[]>([])

    const isReadOnlyImpersonation = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Boolean((currentUser as any)?._impersonationContext)
    }, [currentUser])

    // Extract disciplines and frentes based on selected course
    React.useEffect(() => {
        if (!cursoSelecionado || estruturaHierarquica.length === 0) {
            setDisciplinas([])
            setFrentes([])
            return
        }

        const curso = estruturaHierarquica.find((c) => c.id === cursoSelecionado)
        if (!curso) {
            setDisciplinas([])
            setFrentes([])
            return
        }

        // Extract unique disciplines
        const disciplinasUnicas = curso.disciplinas.map((disc: DisciplinaComFrentes) => ({
            id: disc.id,
            nome: disc.nome,
        }))
        setDisciplinas(disciplinasUnicas)

        // Extract unique frentes
        const frentesUnicas: Array<{ id: string; nome: string; disciplina_id: string }> = []
        curso.disciplinas.forEach((disc: DisciplinaComFrentes) => {
            disc.frentes.forEach((frente: FrenteComModulos) => {
                if (!frentesUnicas.find((f) => f.id === frente.id)) {
                    frentesUnicas.push({
                        id: frente.id,
                        nome: frente.nome,
                        disciplina_id: frente.disciplinaId,
                    })
                }
            })
        })
        setFrentes(frentesUnicas)
    }, [cursoSelecionado, estruturaHierarquica])

    // Initial Data Load
    React.useEffect(() => {
        const fetchData = async () => {
            if (!currentUser.id || !currentUser.role) return

            setIsLoadingAtividades(true)
            setError(null)

            try {
                const data = await salaEstudosService.getInitialData(currentUser.id, currentUser.role, activeOrgId)
                setAtividades(data.atividades)
                setEstruturaHierarquica(data.estrutura)
                setCursos(data.cursos)

                // Select first course if only one exists and none is currently selected
                if (data.cursos.length === 1) {
                    setCursoSelecionado((prev) => prev || data.cursos[0].id)
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err)
                setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados')
            } finally {
                setIsLoadingAtividades(false)
            }
        }

        fetchData()
    }, [currentUser.id, currentUser.role, activeOrgId])

    // Handlers
    const handleStatusChange = async (atividadeId: string, status: StatusAtividade) => {
        if (isReadOnlyImpersonation) return

        // Optimistic update
        setAtividades(prev => prev.map(a =>
            a.id === atividadeId
                ? { ...a, progressoStatus: status }
                : a
        ))

        try {
            await salaEstudosService.updateStatus(atividadeId, status)
        } catch (error) {
            console.error('Falha ao atualizar status:', error)
            // Rollback on error not implemented for simplicity, but could refetch
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
        setAtividades(prev => prev.map(a =>
            a.id === atividadeId
                ? {
                    ...a,
                    progressoStatus: status,
                    questoesTotais: desempenho.questoesTotais,
                    questoesAcertos: desempenho.questoesAcertos,
                    dificuldadePercebida: desempenho.dificuldadePercebida,
                    anotacoesPessoais: desempenho.anotacoesPessoais
                }
                : a
        ))

        try {
            await salaEstudosService.updateDesempenho(atividadeId, status, desempenho)
        } catch (error) {
            console.error('Falha ao registrar desempenho:', error)
        }
    }

    // Filtered Activities
    const atividadesFiltradas = React.useMemo(() => {
        let filtradas = atividades
        if (cursoSelecionado) filtradas = filtradas.filter((a) => a.cursoId === cursoSelecionado)
        if (disciplinaSelecionada) filtradas = filtradas.filter((a) => a.disciplinaId === disciplinaSelecionada)
        if (frenteSelecionada) filtradas = filtradas.filter((a) => a.frenteId === frenteSelecionada)
        return filtradas
    }, [atividades, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])

    // Filtered Hierarchy
    const estruturaFiltrada = React.useMemo(() => {
        if (!cursoSelecionado && !disciplinaSelecionada && !frenteSelecionada) {
            return estruturaHierarquica
        }

        // Rebuild hierarchy from filtered activities
        // We can reuse the service logic here or just filter the existing hierarchy structure on the fly
        // Simpler to just use local helper or even import the builder from service if it was static?
        // Since we have the filtering logic already implemented in previous client, let's substitute it with a simpler approach:
        // We can just rely on the 'atividadesFiltradas' to rebuild 'estrutura' using the service's method if we expose it,
        // OR we can implement a lightweight builder here.

        // For now, let's create a minimal hierarchy from 'atividadesFiltradas'
        const estrutura: CursoComDisciplinas[] = []
        const mapC = new Map<string, CursoComDisciplinas>()
        const mapD = new Map<string, DisciplinaComFrentes>()
        const mapF = new Map<string, FrenteComModulos>()
        const mapM = new Map<string, ModuloComAtividades>()

        atividadesFiltradas.forEach(atv => {
            if (!mapC.has(atv.cursoId)) {
                const c = { id: atv.cursoId, nome: atv.cursoNome, disciplinas: [] }
                mapC.set(atv.cursoId, c)
                estrutura.push(c)
            }
            const c = mapC.get(atv.cursoId)!

            const dKey = `${atv.cursoId}-${atv.disciplinaId}`
            if (!mapD.has(dKey)) {
                const d = { id: atv.disciplinaId, nome: atv.disciplinaNome, frentes: [] }
                mapD.set(dKey, d)
                c.disciplinas.push(d)
            }
            const d = mapD.get(dKey)!

            const fKey = `${atv.disciplinaId}-${atv.frenteId}`
            if (!mapF.has(fKey)) {
                const f = { id: atv.frenteId, nome: atv.frenteNome, disciplinaId: atv.disciplinaId, modulos: [] }
                mapF.set(fKey, f)
                d.frentes.push(f)
            }
            const f = mapF.get(fKey)!

            if (!mapM.has(atv.moduloId)) {
                const m = { id: atv.moduloId, nome: atv.moduloNome, numeroModulo: atv.moduloNumero, frenteId: atv.frenteId, atividades: [] }
                mapM.set(atv.moduloId, m)
                f.modulos.push(m)
            }
            const m = mapM.get(atv.moduloId)!
            m.atividades.push(atv)
        })
        return estrutura
    }, [atividadesFiltradas, estruturaHierarquica, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-subtitle">{description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <OrganizationSwitcher />
                </div>
            </div>

            {isReadOnlyImpersonation && (
                <div className="rounded-md bg-amber-500/10 p-4 text-amber-500 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>
                        Modo de visualização (Impersonação): Você está vendo os dados do aluno como somente leitura.
                        Alterações de status não serão salvas.
                    </p>
                </div>
            )}

            {/* Filtros */}
            <SalaEstudosFilters
                cursos={cursos}
                disciplinas={disciplinas}
                frentes={frentes}
                cursoSelecionado={cursoSelecionado}
                disciplinaSelecionada={disciplinaSelecionada}
                frenteSelecionada={frenteSelecionada}
                onCursoChange={(id) => {
                    setCursoSelecionado(id)
                    setDisciplinaSelecionada('')
                    setFrenteSelecionada('')
                }}
                onDisciplinaChange={(id) => {
                    setDisciplinaSelecionada(id)
                    setFrenteSelecionada('')
                }}
                onFrenteChange={(id) => setFrenteSelecionada(id)}
                isLoadingDisciplinas={false}
                isLoadingFrentes={false}
            />

            {/* Stats Card */}
            <ProgressoStatsCard
                atividades={atividadesFiltradas} // Use filtered activities for stats
                totalGeral={atividades.length}
                hasFilters={atividadesFiltradas.length !== atividades.length}
                contexto={{
                    curso: cursos.find(c => c.id === cursoSelecionado)?.nome,
                    disciplina: disciplinas.find(d => d.id === disciplinaSelecionada)?.nome,
                    frente: frentes.find(f => f.id === frenteSelecionada)?.nome
                }}
            />

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoadingAtividades ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                /* Content List */
                <div className="space-y-6">
                    {estruturaFiltrada.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <School className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">Nenhuma atividade encontrada</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                                {atividades.length === 0
                                    ? "Você ainda não possui atividades disponíveis. Entre em contato com a coordenação."
                                    : "Nenhuma atividade corresponde aos filtros selecionados."}
                            </p>
                        </div>
                    ) : (
                        estruturaFiltrada.map((curso) => (
                            <div key={curso.id} className="space-y-4">
                                {cursos.length > 1 && (
                                    <h2 className="text-xl font-semibold border-b pb-2">{curso.nome}</h2>
                                )}

                                {curso.disciplinas.map((disciplina: DisciplinaComFrentes) => (
                                    <div key={disciplina.id} className="ml-0 md:ml-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-primary">{disciplina.nome}</h3>
                                            <div className="h-px flex-1 bg-border/50" />
                                        </div>

                                        {disciplina.frentes.map((frente: FrenteComModulos) => (
                                            <div key={frente.id} className="ml-0 md:ml-4 mb-6">
                                                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                                                    {frente.nome}
                                                </h4>

                                                <div className="space-y-2">
                                                    {frente.modulos.map((modulo: ModuloComAtividades) => (
                                                        <ModuloActivitiesAccordion
                                                            key={modulo.id}
                                                            modulo={modulo}
                                                            onStatusChange={isReadOnlyImpersonation ? undefined : handleStatusChange}
                                                            onStatusChangeWithDesempenho={isReadOnlyImpersonation ? undefined : handleStatusChangeWithDesempenho}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
