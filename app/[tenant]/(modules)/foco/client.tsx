'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { useStudyTimer } from '@/hooks/use-study-timer'
import { createClient } from '@/app/shared/core/client'
import { useOptionalTenantContext } from '@/app/[tenant]/tenant-context'
import { MetodoEstudo } from '@/app/[tenant]/(modules)/sala-de-estudos/types'
import {
    Option,
    ModuloOption,
    PresenceCounter,
    POMODORO_DEFAULT,
    FOCUS_CONTEXT_STORAGE_KEY
} from './types'
import { focoService } from './services/foco.service'
import { PresenceBadge } from './components/focus-header'
import { ContextSelector } from './components/context-selector'
import { TimerConfig } from './components/timer-config'
import { CleanView } from './components/clean-view'
import { SessionSummaryModal } from './components/session-summary-modal'
import { PageShell } from '@/app/shared/components/layout/page-shell'

function formatMs(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
}

interface LastContextInfo {
    cursoId?: string
    disciplinaId?: string
    cursoNome?: string
    disciplinaNome?: string
}

export default function FocoClient() {
    const router = useRouter()
    const params = useParams()
    const tenant = params?.tenant as string
    const nextSearchParams = useNextSearchParams()
    const tenantContext = useOptionalTenantContext()
    const empresaId = tenantContext?.empresaId ?? null
    const supabase = useMemo(() => createClient(), [])

    // -- Timer Hook --
    const { state, start, pause, resume, finalize, latestState } = useStudyTimer()

    // -- Local State --
    const [metodo, setMetodo] = useState<MetodoEstudo>('cronometro')
    const [timerMin, setTimerMin] = useState<number>(25)
    const [pomodoroConfig, setPomodoroConfig] = useState(POMODORO_DEFAULT)

    const [isCleanView, setIsCleanView] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [fullscreenError, setFullscreenError] = useState<string | null>(null)

    // Context State
    const [cursoId, setCursoId] = useState<string>('')
    const [disciplinaId, setDisciplinaId] = useState('')
    const [frenteId, setFrenteId] = useState('')
    const [moduloId, setModuloId] = useState<string>('')
    const [atividadeId, setAtividadeId] = useState('')
    const [lastContext, setLastContext] = useState<LastContextInfo | null>(null)

    // Data State
    const [cursos, setCursos] = useState<Option[]>([])
    const [disciplinas, setDisciplinas] = useState<Option[]>([])
    const [frentes, setFrentes] = useState<Option[]>([])
    const [modulos, setModulos] = useState<ModuloOption[]>([])
    const [atividades, setAtividades] = useState<Option[]>([])

    const [loadingCursos, setLoadingCursos] = useState(false)
    const [loadingDisciplinas, setLoadingDisciplinas] = useState(false)
    const [loadingFrentes, setLoadingFrentes] = useState(false)
    const [loadingModulos, setLoadingModulos] = useState(false)
    const [loadingAtividades, setLoadingAtividades] = useState(false)

    // Session State
    const [sessaoId, setSessaoId] = useState<string | null>(null)
    const [iniciando, setIniciando] = useState(false)
    const [finalizando, setFinalizando] = useState(false)
    const [showFinalizeModal, setShowFinalizeModal] = useState(false)

    // Feedback State
    const [nivelFoco, setNivelFoco] = useState<number>(3)
    const [concluiuAtividade, setConcluiuAtividade] = useState<boolean>(false)
    const [presence, setPresence] = useState<PresenceCounter>({ count: 1, channel: 'geral' })
    const [erro, setErro] = useState<string | null>(null)

    // -- Effects: Data Loading --

    // Restore context from localStorage (when URL doesn't specify it)
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const raw = window.localStorage.getItem(FOCUS_CONTEXT_STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw) as Partial<{
                cursoId: string
                disciplinaId: string
                frenteId: string
                moduloId: string
                atividadeId: string
            }>

            // Don't auto-set, just store for quick-start
            if (parsed.disciplinaId) {
                // We'll populate lastContext after disciplinas load
                setLastContext({
                    cursoId: parsed.cursoId,
                    disciplinaId: parsed.disciplinaId
                })
            }
        } catch {
            /* ignore */
        }
    }, [])

    // load from URL
    useEffect(() => {
        const cid = nextSearchParams.get('cursoId')
        const did = nextSearchParams.get('disciplinaId')
        const fid = nextSearchParams.get('frenteId')
        const mid = nextSearchParams.get('moduloId')
        const aid = nextSearchParams.get('atividadeId')

        if (cid) setCursoId(cid)
        if (did) setDisciplinaId(did)
        if (fid) setFrenteId(fid)
        if (mid) setModuloId(mid)
        if (aid) setAtividadeId(aid)
    }, [nextSearchParams])

    // Persist Context
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.setItem(
                FOCUS_CONTEXT_STORAGE_KEY,
                JSON.stringify({ cursoId, disciplinaId, frenteId, moduloId, atividadeId })
            )
        } catch { /* ignore */ }
    }, [cursoId, disciplinaId, frenteId, moduloId, atividadeId])

    // Load Cursos (filtrados pelo tenant ativo)
    useEffect(() => {
        setLoadingCursos(true)
        focoService.getCursos(empresaId)
            .then(setCursos)
            .catch(console.error)
            .finally(() => setLoadingCursos(false))
    }, [empresaId])

    // Load Disciplinas (filtradas pelo tenant ativo)
    useEffect(() => {
        setLoadingDisciplinas(true)
        focoService.getDisciplinas(empresaId)
            .then((data) => {
                setDisciplinas(data)
                // Update lastContext with names after loading
                if (lastContext?.disciplinaId) {
                    const disc = data.find(d => d.id === lastContext.disciplinaId)
                    if (disc) {
                        setLastContext(prev => prev ? { ...prev, disciplinaNome: disc.nome } : null)
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoadingDisciplinas(false))
    }, [empresaId, lastContext?.disciplinaId])

    // Update lastContext with curso name
    useEffect(() => {
        if (lastContext?.cursoId && cursos.length > 0) {
            const curso = cursos.find(c => c.id === lastContext.cursoId)
            if (curso) {
                setLastContext(prev => prev ? { ...prev, cursoNome: curso.nome } : null)
            }
        }
    }, [cursos, lastContext?.cursoId])

    // Load Frentes
    useEffect(() => {
        if (!disciplinaId || !cursoId) {
            setFrentes([]); setFrenteId(''); return
        }
        setLoadingFrentes(true)
        focoService.getFrentes(cursoId, disciplinaId)
            .then(data => {
                setFrentes(data)
                if (frenteId && !data.some(f => f.id === frenteId)) setFrenteId('')
            })
            .catch(console.error)
            .finally(() => setLoadingFrentes(false))
    }, [disciplinaId, cursoId, frenteId])

    // Load Modulos
    useEffect(() => {
        if (!frenteId) {
            setModulos([]); setModuloId(''); return
        }
        setLoadingModulos(true)
        focoService.getModulos(frenteId)
            .then(data => {
                setModulos(data)
                if (moduloId && !data.some(m => m.id === moduloId)) setModuloId('')
            })
            .catch(console.error)
            .finally(() => setLoadingModulos(false))
    }, [frenteId, moduloId])

    // Load Atividades (filtradas pelo tenant)
    useEffect(() => {
        if (!moduloId) {
            setAtividades([]); setAtividadeId(''); return
        }
        setLoadingAtividades(true)
        focoService.getAtividades(moduloId, empresaId)
            .then(data => {
                setAtividades(data)
                if (atividadeId && !data.some(a => a.id === atividadeId)) setAtividadeId('')
            })
            .catch(console.error)
            .finally(() => setLoadingAtividades(false))
    }, [moduloId, atividadeId, empresaId])

    // -- Realtime Presence --
    useEffect(() => {
        let mounted = true
        let channelCleanup: (() => void) | null = null

        const join = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const room = `modo-foco:${disciplinaId || 'geral'}`
                const channel = supabase.channel(room, { config: { presence: { key: user.id } } })

                channel.on('presence', { event: 'sync' }, () => {
                    const total = Object.keys(channel.presenceState()).length
                    if (mounted) setPresence({ count: total || 1, channel: room })
                })

                await channel.subscribe()
                await channel.track({
                    user_id: user.id,
                    disciplina_id: disciplinaId || null,
                    frente_id: frenteId || null,
                    atividade_id: atividadeId || null,
                })

                channelCleanup = () => channel.unsubscribe()
            } catch (err) {
                console.error(err)
            }
        }
        join()
        return () => {
            mounted = false
            if (channelCleanup) channelCleanup()
        }
    }, [supabase, disciplinaId, frenteId, atividadeId])

    // -- Fullscreen Helpers --
    useEffect(() => {
        if (typeof document === 'undefined') return
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
    }, [])

    const enterFullscreen = useCallback(async (source: 'auto' | 'user') => {
        if (typeof document === 'undefined') return
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
        } catch {
            if (source === 'user') setFullscreenError('Não foi possível entrar em tela cheia (bloqueado pelo navegador).')
        }
    }, [])

    const exitFullscreen = useCallback(async () => {
        if (typeof document === 'undefined') return
        try {
            if (document.fullscreenElement) await document.exitFullscreen()
        } catch { }
    }, [])

    const enterCleanView = useCallback(async () => {
        setIsCleanView(true)
        await enterFullscreen('auto')
    }, [enterFullscreen])

    const leaveCleanView = useCallback(async () => {
        setIsCleanView(false)
        await exitFullscreen()
    }, [exitFullscreen])

    // Block scroll in clean view & ESC handler
    useEffect(() => {
        if (typeof window === 'undefined') return
        const prevOverflow = document.body.style.overflow
        if (isCleanView) document.body.style.overflow = 'hidden'

        const onKeyDown = (e: KeyboardEvent) => {
            if (!isCleanView) return
            if (e.key === 'Escape') {
                e.preventDefault()
                void leaveCleanView()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prevOverflow
        }
    }, [isCleanView, leaveCleanView])

    // -- Session Logic --

    // Heartbeat
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null
        if (state.running && !state.paused && sessaoId) {
            focoService.sendHeartbeat(sessaoId, empresaId)
            timer = setInterval(() => focoService.sendHeartbeat(sessaoId, empresaId), 30000)
        }
        return () => { if (timer) clearInterval(timer) }
    }, [state.running, state.paused, sessaoId, empresaId])

    // Quick start handler
    const handleQuickStart = useCallback(() => {
        if (lastContext?.cursoId) setCursoId(lastContext.cursoId)
        if (lastContext?.disciplinaId) setDisciplinaId(lastContext.disciplinaId)
    }, [lastContext])

    const handleStart = async () => {
        if (iniciando) return
        setErro(null)
        if (!disciplinaId) {
            setErro('Selecione uma disciplina para iniciar.')
            return
        }

        setIniciando(true)
        try {
            const sessionData = await focoService.iniciarSessao(
                disciplinaId || null,
                frenteId || null,
                moduloId || null,
                atividadeId || null,
                metodo,
                empresaId
            )

            setSessaoId(sessionData.id)

            if (metodo === 'timer') {
                start({ mode: 'timer', durationMs: timerMin * 60 * 1000, startIso: sessionData.inicio })
            } else if (metodo === 'pomodoro') {
                start({ mode: 'pomodoro', pomodoro: pomodoroConfig, startIso: sessionData.inicio })
            } else {
                start({ mode: 'cronometro', startIso: sessionData.inicio })
            }

            await enterCleanView()
        } catch (err) {
            console.error(err)
            setErro(err instanceof Error ? err.message : 'Erro ao iniciar')
        } finally {
            setIniciando(false)
        }
    }

    const handleFinalize = async () => {
        if (finalizando || !sessaoId) return
        setErro(null)
        setFinalizando(true)

        try {
            await leaveCleanView()
            finalize()

            const snapshot = latestState()
            await focoService.finalizarSessao(
                sessaoId,
                snapshot.logPausas,
                snapshot.lastTickAt,
                nivelFoco,
                concluiuAtividade,
                atividadeId,
                empresaId
            )

            router.push(tenant ? `/${tenant}/sala-de-estudos` : '/sala-de-estudos')
        } catch (err) {
            console.error(err)
            setErro(err instanceof Error ? err.message : 'Erro ao finalizar')
        } finally {
            setFinalizando(false)
            setShowFinalizeModal(false)
        }
    }

    // Calculate session stats for the modal
    const sessionStats = useMemo(() => {
        const snapshot = latestState()
        const logPausas = snapshot.logPausas || []

        const pauseCount = logPausas.filter(p => p.tipo === 'manual').length
        const distractionCount = logPausas.filter(p => p.tipo === 'distracao').length
        const totalPauseMs = logPausas.reduce((acc, p) => {
            if (!p.inicio || !p.fim) return acc
            return acc + (new Date(p.fim).getTime() - new Date(p.inicio).getTime())
        }, 0)

        return { pauseCount, distractionCount, totalPauseMs }
    }, [latestState])

    // Get selected atividade name
    const selectedAtividadeNome = useMemo(() =>
        atividades.find(a => a.id === atividadeId)?.nome,
        [atividades, atividadeId]
    )

    const elapsedLabel = formatMs(state.elapsedMs)
    const remainingLabel = state.remainingMs !== null ? formatMs(state.remainingMs) : (state.running ? '...' : '-')

    return (
        <>
            {isCleanView && (
                <CleanView
                    elapsedLabel={elapsedLabel}
                    remainingLabel={remainingLabel}
                    metodo={metodo}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => isFullscreen ? exitFullscreen() : enterFullscreen('user')}
                    fullscreenError={fullscreenError}
                    state={state}
                    onPause={pause}
                    onResume={resume}
                    onShowFinalizeModal={() => {
                        leaveCleanView()
                        setShowFinalizeModal(true)
                    }}
                    pomodoroPhase={state.phase?.phase}
                    pomodoroCycle={state.phase?.cycle}
                    totalCycles={pomodoroConfig.totalCycles}
                />
            )}

            <div className="container mx-auto max-w-3xl" aria-hidden={isCleanView}>
                <PageShell
                    title="Modo Foco"
                    subtitle="Estudo imersivo para máxima concentração"
                    actions={<PresenceBadge count={presence.count} />}
                >
                {erro && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <span className="font-medium">Erro:</span>
                        {erro}
                    </div>
                )}

                <ContextSelector
                    cursos={cursos}
                    disciplinas={disciplinas}
                    frentes={frentes}
                    modulos={modulos}
                    atividades={atividades}
                    cursoId={cursoId}
                    disciplinaId={disciplinaId}
                    frenteId={frenteId}
                    moduloId={moduloId}
                    atividadeId={atividadeId}
                    onCursoChange={(id) => {
                        setCursoId(id); setDisciplinaId(''); setFrenteId(''); setModuloId(''); setAtividadeId('')
                    }}
                    onDisciplinaChange={setDisciplinaId}
                    onFrenteChange={setFrenteId}
                    onModuloChange={setModuloId}
                    onAtividadeChange={setAtividadeId}
                    loadingCursos={loadingCursos}
                    loadingDisciplinas={loadingDisciplinas}
                    loadingFrentes={loadingFrentes}
                    loadingModulos={loadingModulos}
                    loadingAtividades={loadingAtividades}
                    lastContext={lastContext}
                    onQuickStart={handleQuickStart}
                />

                <TimerConfig
                    metodo={metodo}
                    onMetodoChange={setMetodo}
                    timerMin={timerMin}
                    onTimerMinChange={setTimerMin}
                    pomodoroFocusMs={pomodoroConfig.focusMs}
                    onPomodoroFocusChange={(val) => setPomodoroConfig(p => ({ ...p, focusMs: val }))}
                    pomodoroShortBreakMs={pomodoroConfig.shortBreakMs}
                    onPomodoroShortBreakChange={(val) => setPomodoroConfig(p => ({ ...p, shortBreakMs: val }))}
                    pomodoroLongBreakMs={pomodoroConfig.longBreakMs ?? 0}
                    onPomodoroLongBreakChange={(val) => setPomodoroConfig(p => ({ ...p, longBreakMs: val }))}
                    pomodoroCycles={pomodoroConfig.totalCycles ?? 4}
                    onPomodoroCyclesChange={(val) => setPomodoroConfig(p => ({ ...p, totalCycles: val }))}
                    onStart={handleStart}
                    iniciando={iniciando}
                    disciplinaId={disciplinaId}
                />
                </PageShell>
            </div>

            {/* Session Summary Modal */}
            <SessionSummaryModal
                open={showFinalizeModal}
                onOpenChange={setShowFinalizeModal}
                elapsedMs={state.elapsedMs}
                pauseCount={sessionStats.pauseCount}
                distractionCount={sessionStats.distractionCount}
                totalPauseMs={sessionStats.totalPauseMs}
                nivelFoco={nivelFoco}
                onNivelFocoChange={setNivelFoco}
                concluiuAtividade={concluiuAtividade}
                onConcluiuAtividadeChange={setConcluiuAtividade}
                hasAtividade={!!atividadeId}
                atividadeNome={selectedAtividadeNome}
                onFinalize={handleFinalize}
                finalizando={finalizando}
            />
        </>
    )
}
