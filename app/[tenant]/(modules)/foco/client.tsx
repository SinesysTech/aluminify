'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { useStudyTimer } from '@/hooks/use-study-timer'
import { createClient } from '@/app/shared/core/client'
import { MetodoEstudo } from '@/app/[tenant]/(modules)/sala-de-estudos/types'
import {
    Option,
    ModuloOption,
    PresenceCounter,
    POMODORO_DEFAULT,
    FOCUS_CONTEXT_STORAGE_KEY
} from './types'
import { focoService } from './services/foco.service'
import { FocusHeader } from './components/focus-header'
import { ContextSelector } from './components/context-selector'
import { TimerConfig } from './components/timer-config'
import { CleanView } from './components/clean-view'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/shared/components/overlay/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/app/shared/components/forms/label'
import { Slider } from '@/components/ui/slider'

function formatMs(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
}

export default function FocoClient() {
    const router = useRouter()
    const params = useParams()
    const tenant = params?.tenant as string
    const nextSearchParams = useNextSearchParams()
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

    // Load Cursos
    useEffect(() => {
        setLoadingCursos(true)
        focoService.getCursos()
            .then(setCursos)
            .catch(console.error)
            .finally(() => setLoadingCursos(false))
    }, [])

    // Load Disciplinas
    useEffect(() => {
        setLoadingDisciplinas(true)
        focoService.getDisciplinas()
            .then(setDisciplinas)
            .catch(console.error)
            .finally(() => setLoadingDisciplinas(false))
    }, [])

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

    // Load Atividades
    useEffect(() => {
        if (!moduloId) {
            setAtividades([]); setAtividadeId(''); return
        }
        setLoadingAtividades(true)
        focoService.getAtividades(moduloId)
            .then(data => {
                setAtividades(data)
                if (atividadeId && !data.some(a => a.id === atividadeId)) setAtividadeId('')
            })
            .catch(console.error)
            .finally(() => setLoadingAtividades(false))
    }, [moduloId, atividadeId])

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
            focoService.sendHeartbeat(sessaoId)
            timer = setInterval(() => focoService.sendHeartbeat(sessaoId), 30000)
        }
        return () => { if (timer) clearInterval(timer) }
    }, [state.running, state.paused, sessaoId])

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
                metodo
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
                atividadeId
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
                />
            )}

            <div className="space-y-6 container py-6 mx-auto max-w-5xl" aria-hidden={isCleanView}>
                <FocusHeader presenceCount={presence.count} />

                {erro && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
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
            </div>

            {/* Modal de Finalização */}
            <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sessão Finalizada!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Como foi seu nível de foco?</Label>
                            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                <span>Distraído</span>
                                <span>Zen</span>
                            </div>
                            <Slider
                                value={[nivelFoco]}
                                onValueChange={(v) => setNivelFoco(v[0])}
                                min={1}
                                max={5}
                                step={1}
                                className="py-2"
                            />
                            <div className="text-center text-sm font-semibold text-primary">
                                {nivelFoco === 1 && 'Socorro'}
                                {nivelFoco === 2 && 'Precisa melhorar'}
                                {nivelFoco === 3 && 'Na média'}
                                {nivelFoco === 4 && 'Bom foco'}
                                {nivelFoco === 5 && 'Eu sou a própria concentração'}
                            </div>
                        </div>

                        {atividadeId && (
                            <div className="flex items-center gap-2 border p-3 rounded-md bg-muted/20">
                                <input
                                    type="checkbox"
                                    checked={concluiuAtividade}
                                    onChange={(e) => setConcluiuAtividade(e.target.checked)}
                                    id="check-concluded"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="check-concluded" className="text-sm font-medium cursor-pointer">
                                    Concluir atividade selecionada
                                </label>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleFinalize} disabled={finalizando}>
                            {finalizando ? 'Salvando...' : 'Salvar e Sair'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
