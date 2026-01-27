'use client'

import * as React from 'react'
import { AlertCircle, School } from 'lucide-react'
import { Skeleton } from '@/app/shared/components/feedback/skeleton'
import { useCurrentUser } from '@/components/providers/user-provider'
import { OrganizationSwitcher } from '@/app/[tenant]/(modules)/dashboard/components/organization-switcher'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import { AtividadeComProgresso, CursoComDisciplinas, DisciplinaComFrentes, FrenteComModulos } from './types'
import { StatusAtividade } from '@/app/shared/types/enums'
import { fetchBibliotecaData } from './services/biblioteca.service'
import { BibliotecaFilters } from './components/biblioteca-filters'
import { ContentList } from './components/content-list'
import { LibraryStats } from './components/library-stats'
import { DesempenhoData } from './components/desempenho-modal'

interface BibliotecaClientProps {
    title?: string
    description?: string
}

export default function BibliotecaClient({
    title = 'Biblioteca',
    description = 'Acesse todo o conteúdo didático e materiais de estudo',
}: BibliotecaClientProps) {
    const currentUser = useCurrentUser()
    const { activeOrganization } = useStudentOrganizations()
    const activeOrgId = activeOrganization?.id

    const [atividades, setAtividades] = React.useState<AtividadeComProgresso[]>([])
    const [cursos, setCursos] = React.useState<Array<{ id: string; nome: string }>>([])
    const [disciplinas, setDisciplinas] = React.useState<Array<{ id: string; nome: string }>>([])
    const [frentes, setFrentes] = React.useState<Array<{ id: string; nome: string; disciplina_id: string }>>([])

    const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
    const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
    const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')

    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [estruturaHierarquica, setEstruturaHierarquica] = React.useState<CursoComDisciplinas[]>([])

    const userRole = currentUser.role
    const alunoId = currentUser.id

    const isReadOnlyImpersonation = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Boolean((currentUser as any)?._impersonationContext)
    }, [currentUser])

    // Initial Fetch logic
    // We separate the fetch from the auto-select logic to avoid dep cycles or stale closures if we included cursoSelecionado
    React.useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            if (!alunoId) return
            setIsLoading(true)
            setError(null)

            try {
                const data = await fetchBibliotecaData(alunoId, userRole, activeOrgId)

                if (isMounted) {
                    setAtividades(data.atividades)
                    setEstruturaHierarquica(data.estrutura)
                    setCursos(data.cursos)

                    // Auto-select course if only one
                    if (data.cursos.length === 1) {
                        // We can safely set this here as it's the result of the fetch
                        setCursoSelecionado(prev => prev || data.cursos[0].id)
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erro ao carregar biblioteca')
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [alunoId, userRole, activeOrgId]) // Removed 'cursoSelecionado' from deps as we only use it in the setter callback or don't need it for the fetch itself

    // Cascading Filters
    React.useEffect(() => {
        if (!cursoSelecionado || estruturaHierarquica.length === 0) {
            setDisciplinas([])
            setFrentes([])
            return
        }

        const curso = estruturaHierarquica.find(c => c.id === cursoSelecionado)
        if (!curso) {
            setDisciplinas([])
            setFrentes([])
            return
        }

        const disciplinasUnicas = curso.disciplinas.map(d => ({ id: d.id, nome: d.nome }))
        setDisciplinas(disciplinasUnicas)

        const frentesUnicas: Array<{ id: string; nome: string; disciplina_id: string }> = []
        curso.disciplinas.forEach(d => {
            d.frentes.forEach(f => {
                if (!frentesUnicas.find(ex => ex.id === f.id)) {
                    frentesUnicas.push({ id: f.id, nome: f.nome, disciplina_id: f.disciplinaId })
                }
            })
        })
        setFrentes(frentesUnicas)

    }, [cursoSelecionado, estruturaHierarquica])

    // Filtering Logic
    const atividadesFiltradas = React.useMemo(() => {
        return atividades.filter(a => {
            if (cursoSelecionado && a.cursoId !== cursoSelecionado) return false
            if (disciplinaSelecionada && a.disciplinaId !== disciplinaSelecionada) return false
            if (frenteSelecionada && a.frenteId !== frenteSelecionada) return false
            return true
        })
    }, [atividades, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])

    const estruturaFiltrada = React.useMemo(() => {
        if (!cursoSelecionado && !disciplinaSelecionada && !frenteSelecionada) return estruturaHierarquica

        // Reconstruct filtered hierarchy
        // Simple approach: filter hierarchy locally
        return estruturaHierarquica.map(curso => {
            if (cursoSelecionado && curso.id !== cursoSelecionado) return null

            const disciplinas = curso.disciplinas.map(disc => {
                if (disciplinaSelecionada && disc.id !== disciplinaSelecionada) return null

                const frentes = disc.frentes.map(frente => {
                    if (frenteSelecionada && frente.id !== frenteSelecionada) return null
                    return frente // Keep all modules of selected frente
                }).filter((f): f is FrenteComModulos => f !== null)

                if (frentes.length === 0) return null
                return { ...disc, frentes }
            }).filter((d): d is DisciplinaComFrentes => d !== null)

            if (disciplinas.length === 0) return null
            return { ...curso, disciplinas }
        }).filter((c): c is CursoComDisciplinas => c !== null)

    }, [estruturaHierarquica, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])


    // Handlers (Mocked/Placeholder as strict logic might need Context or passed props,
    // but we can just use the same API calls or similar if needed.
    // For now, these are read-only in Biblioteca mostly, but if user wants to update status here too:

    const handleStatusChange = async (atividadeId: string, status: StatusAtividade) => {
        // Implement API call to update status
        // For now, console log
        console.log('Update Status', atividadeId, status)
        // Ideally import update service logic
    }

    const handleStatusChangeWithDesempenho = async (id: string, st: StatusAtividade, des: DesempenhoData) => {
        console.log('Update Status Desempenho', id, st, des)
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <School className="h-8 w-8 text-primary" />
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <div className="w-full md:w-auto">
                    <OrganizationSwitcher />
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            ) : isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <>
                    <BibliotecaFilters
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
                        onFrenteChange={setFrenteSelecionada}
                    />

                    <LibraryStats
                        atividades={atividadesFiltradas}
                        totalGeral={atividades.length}
                        hasFilters={!!(cursoSelecionado || disciplinaSelecionada || frenteSelecionada)}
                        contexto={{
                            curso: cursos.find(c => c.id === cursoSelecionado)?.nome,
                            disciplina: disciplinas.find(d => d.id === disciplinaSelecionada)?.nome,
                            frente: frentes.find(f => f.id === frenteSelecionada)?.nome
                        }}
                    />

                    <div className="space-y-4">
                        {estruturaFiltrada.map(curso => (
                            <div key={curso.id} className="space-y-4">
                                {curso.disciplinas.map(disciplina => (
                                    <div key={disciplina.id} className="space-y-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                            {disciplina.nome}
                                        </h3>
                                        {disciplina.frentes.map(frente => (
                                            <div key={frente.id} className="pl-4 border-l-2 border-muted space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                                    {frente.nome}
                                                </h4>
                                                {frente.modulos.map(modulo => (
                                                    <ContentList
                                                        key={modulo.id}
                                                        modulo={modulo}
                                                        onStatusChange={!isReadOnlyImpersonation ? handleStatusChange : undefined}
                                                        onStatusChangeWithDesempenho={!isReadOnlyImpersonation ? handleStatusChangeWithDesempenho : undefined}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {estruturaFiltrada.length === 0 && !isLoading && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum conteúdo encontrado para os filtros selecionados.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
