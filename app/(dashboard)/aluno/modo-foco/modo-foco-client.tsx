'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams as useNextSearchParams, useRouter } from 'next/navigation';
import { Play, Pause, StopCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/client';
import { useStudyTimer } from '@/hooks/use-study-timer';
import { MetodoEstudo } from '@/types/sessao-estudo';

type PresenceCounter = {
  count: number;
  channel: string;
};

type Option = { id: string; nome: string };
type ModuloOption = { id: string; nome: string; numero_modulo: number | null };

const POMODORO_DEFAULT = {
  focusMs: 25 * 60 * 1000,
  shortBreakMs: 5 * 60 * 1000,
  longBreakMs: 15 * 60 * 1000,
  cyclesBeforeLongBreak: 4,
  totalCycles: 4,
};

const FOCUS_CONTEXT_STORAGE_KEY = 'modo-foco:context';

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function ModoFocoClient() {
  const { state, start, pause, resume, finalize, latestState } = useStudyTimer();
  const [metodo, setMetodo] = useState<MetodoEstudo>('cronometro');
  const [timerMin, setTimerMin] = useState<number>(25);
  const [pomodoroConfig, setPomodoroConfig] = useState(POMODORO_DEFAULT);
  const [isCleanView, setIsCleanView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const nextSearchParams = useNextSearchParams();
  const [cursoId, setCursoId] = useState<string>('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [frenteId, setFrenteId] = useState('');
  const [moduloId, setModuloId] = useState<string>('');
  const [atividadeId, setAtividadeId] = useState('');
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [nivelFoco, setNivelFoco] = useState<number>(3);
  const [concluiuAtividade, setConcluiuAtividade] = useState<boolean>(false);
  const [finalizando, setFinalizando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [presence, setPresence] = useState<PresenceCounter>({ count: 1, channel: 'geral' });
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Option[]>([]);
  const [disciplinas, setDisciplinas] = useState<Option[]>([]);
  const [frentes, setFrentes] = useState<Option[]>([]);
  const [modulos, setModulos] = useState<ModuloOption[]>([]);
  const [atividades, setAtividades] = useState<Option[]>([]);
  const [carregandoCursos, setCarregandoCursos] = useState(false);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false);
  const [carregandoFrentes, setCarregandoFrentes] = useState(false);
  const [carregandoModulos, setCarregandoModulos] = useState(false);
  const [carregandoAtividades, setCarregandoAtividades] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [timelineReady, setTimelineReady] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    onFullscreenChange();
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const exitFullscreenSafe = useCallback(async () => {
    if (typeof document === 'undefined') return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const requestFullscreenSafe = useCallback(async (source: 'auto' | 'user') => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    if (!('requestFullscreen' in el) || typeof el.requestFullscreen !== 'function') {
      if (source === 'user') {
        setFullscreenError('Seu navegador nÃ£o suporta tela cheia (Fullscreen API).');
      }
      return;
    }

    if (source === 'user') {
      setFullscreenError(null);
    }

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch (_err) {
      // Quando disparado automaticamente, muitos browsers bloqueiam (precisa de gesto do usuÃ¡rio)
      if (source === 'user') {
        setFullscreenError(
          'NÃ£o foi possÃ­vel entrar em tela cheia. Alguns navegadores bloqueiam essa aÃ§Ã£o por permissÃ£o/polÃ­tica (geralmente precisa ser liberada pelo navegador e iniciada por clique).',
        );
      }
    }
  }, []);

  const enterCleanView = useCallback(async () => {
    setIsCleanView(true);
    // Best-effort: pode falhar por nÃ£o estar no "user gesture"
    if (typeof document === 'undefined') return;
    await requestFullscreenSafe('auto');
  }, [requestFullscreenSafe]);

  const leaveCleanView = useCallback(async () => {
    setIsCleanView(false);
    await exitFullscreenSafe();
  }, [exitFullscreenSafe]);

  // Acessibilidade/UX: enquanto no modo clean, bloquear scroll e permitir ESC para sair
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prevOverflow = document.body.style.overflow;
    if (isCleanView) {
      document.body.style.overflow = 'hidden';
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isCleanView) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        // Sair do modo clean sem encerrar a sessÃ£o (mantÃ©m timer rodando)
        void leaveCleanView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isCleanView, leaveCleanView]);

  useEffect(() => {
    const cursoParam = nextSearchParams.get('cursoId');
    const disciplinaParam = nextSearchParams.get('disciplinaId');
    const frenteParam = nextSearchParams.get('frenteId');
    const moduloParam = nextSearchParams.get('moduloId');
    const atividadeParam = nextSearchParams.get('atividadeId');

    if (cursoParam !== null) setCursoId(cursoParam);
    if (disciplinaParam !== null) setDisciplinaId(disciplinaParam);
    if (frenteParam !== null) setFrenteId(frenteParam);
    if (moduloParam !== null) setModuloId(moduloParam);
    if (atividadeParam !== null) setAtividadeId(atividadeParam);
  }, [nextSearchParams]);

  // Persistir o Ãºltimo contexto selecionado para reuso (ex.: atalho no header do dashboard)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        FOCUS_CONTEXT_STORAGE_KEY,
        JSON.stringify({
          cursoId,
          disciplinaId,
          frenteId,
          moduloId,
          atividadeId,
        }),
      );
    } catch {
      // ignore
    }
  }, [cursoId, disciplinaId, frenteId, moduloId, atividadeId]);

  // Carregar cursos com base no papel
  useEffect(() => {
    const loadCursos = async () => {
      setCarregandoCursos(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;
        const role = (user.user_metadata?.role as string) || 'aluno';
        const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true;

        if (role === 'professor' && !isSuperAdmin) {
          const { data, error: cursosError } = await supabase
            .from('cursos')
            .select('id, nome, created_by')
            .eq('created_by', user.id)
            .order('nome', { ascending: true });
          if (cursosError) throw cursosError;
          setCursos((data ?? []).map((c) => ({ id: c.id, nome: c.nome })));
          if (!cursoId && data && data.length > 0) setCursoId(data[0].id);
        } else if (isSuperAdmin) {
          const { data, error: cursosError } = await supabase
            .from('cursos')
            .select('id, nome')
            .order('nome', { ascending: true });
          if (cursosError) throw cursosError;
          setCursos((data ?? []).map((c) => ({ id: c.id, nome: c.nome })));
          if (!cursoId && data && data.length > 0) setCursoId(data[0].id);
        } else {
          const { data, error: acError } = await supabase
            .from('alunos_cursos')
            .select('curso_id, cursos(id, nome)')
            .eq('aluno_id', user.id)
            .returns<Array<{ curso_id: string; cursos: { id: string; nome: string } | null }>>();
          if (acError) throw acError;
          const lista = (data ?? [])
            .map((ac) => ac.cursos)
            .filter((c): c is { id: string; nome: string } => Boolean(c))
            .map((c) => ({ id: c.id, nome: c.nome }));
          setCursos(lista);
          if (!cursoId && lista.length > 0) setCursoId(lista[0].id);
        }
      } catch (err) {
        console.error('[modo-foco] erro ao carregar cursos', err);
        setErroCarregamento('Erro ao carregar cursos.');
      } finally {
        setCarregandoCursos(false);
      }
    };
    loadCursos();
  }, [cursoId, supabase]);

  // Carregar disciplinas (independente do curso, mas serÃ¡ filtrado nas frentes)
  useEffect(() => {
    const load = async () => {
      setCarregandoDisciplinas(true);
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session) return;
        const { data, error: qError } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .order('nome', { ascending: true });
        if (qError) {
          throw qError;
        }
        setDisciplinas((data ?? []).map((d) => ({ id: d.id, nome: d.nome })));
      } catch (err) {
        console.error('[modo-foco] erro ao carregar disciplinas', err);
        setErroCarregamento('Erro ao carregar disciplinas.');
      } finally {
        setCarregandoDisciplinas(false);
      }
    };
    load();
  }, [supabase]);

  // Carregar frentes ao escolher disciplina e curso
  useEffect(() => {
    if (!disciplinaId || !cursoId) {
      setFrentes([]);
      setFrenteId('');
      setModulos([]);
      setModuloId('');
      setAtividades([]);
      setAtividadeId('');
      return;
    }
    const load = async () => {
      setCarregandoFrentes(true);
      try {
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome')
          .eq('disciplina_id', disciplinaId)
          .eq('curso_id', cursoId)
          .order('nome', { ascending: true });
        if (error) throw error;
        setFrentes((data ?? []).map((f) => ({ id: f.id, nome: f.nome })));
        // Se frente atual nÃ£o pertence, limpar
        if (frenteId && !(data ?? []).some((f) => f.id === frenteId)) {
          setFrenteId('');
        }
      } catch (err) {
        console.error('[modo-foco] erro ao carregar frentes', err);
        setErroCarregamento('Erro ao carregar frentes.');
      } finally {
        setCarregandoFrentes(false);
      }
    };
    load();
  }, [disciplinaId, cursoId, frenteId, supabase]);

  // Carregar mÃ³dulos ao escolher frente
  useEffect(() => {
    if (!frenteId) {
      setModulos([]);
      setAtividades([]);
      setAtividadeId('');
      return;
    }
    const load = async () => {
      setCarregandoModulos(true);
      try {
        const { data, error } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo')
          .eq('frente_id', frenteId)
          .order('numero_modulo', { ascending: true, nullsFirst: false });
        if (error) throw error;
        // Deduplicar para evitar mÃ³dulos repetidos no dropdown quando existem mÃºltiplas aulas/atividades vinculadas
        const listaMap = new Map<string, { id: string; nome: string; numero_modulo: number | null }>();
        (data ?? []).forEach((m) => {
          if (!listaMap.has(m.id)) {
            listaMap.set(m.id, { id: m.id, nome: m.nome, numero_modulo: m.numero_modulo });
          }
        });
        const lista = Array.from(listaMap.values());
        setModulos(lista);
        if (moduloId && !lista.some((m) => m.id === moduloId)) {
          setModuloId('');
        }
        setAtividades([]);
        setAtividadeId('');
      } catch (err) {
        console.error('[modo-foco] erro ao carregar mÃ³dulos', err);
        setErroCarregamento('Erro ao carregar mÃ³dulos.');
      } finally {
        setCarregandoModulos(false);
      }
    };
    load();
  }, [frenteId, moduloId, supabase]);

  // Carregar atividades via API interna usando moduloId
  useEffect(() => {
    if (!moduloId) {
      setAtividades([]);
      setAtividadeId('');
      return;
    }
    const load = async () => {
      setCarregandoAtividades(true);
      try {
        const resp = await fetch(`/api/atividade?modulo_id=${moduloId}`);
        if (!resp.ok) throw new Error('Falha ao carregar atividades');
        const { data } = await resp.json();
        const opts: Option[] = (data ?? []).map((a: { id: string; titulo: string }) => ({ id: a.id, nome: a.titulo }));
        setAtividades(opts);
        if (atividadeId && !opts.some((a) => a.id === atividadeId)) {
          setAtividadeId('');
        }
      } catch (err) {
        console.error('[modo-foco] erro ao carregar atividades', err);
        setErroCarregamento('Erro ao carregar atividades.');
      } finally {
        setCarregandoAtividades(false);
      }
    };
    load();
  }, [moduloId, atividadeId]);

  useEffect(() => {
    let mounted = true;
    let channelCleanup: (() => void) | null = null;

    const joinPresence = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setErro('Falha ao obter usuÃ¡rio para Presence');
          return;
        }

        const key = userData.user.id;
        const room = `modo-foco:${disciplinaId || 'geral'}`;
        const channel = supabase.channel(room, {
          config: {
            presence: { key },
          },
        });

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const total = Object.keys(state).length;
          if (mounted) {
            setPresence({ count: total || 1, channel: room });
          }
        });

        await channel.subscribe();
        await channel.track({
          user_id: key,
          disciplina_id: disciplinaId || null,
          frente_id: frenteId || null,
          atividade_id: atividadeId || null,
        });

        channelCleanup = () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('[modo-foco] erro ao iniciar presence', err);
      }
    };

    joinPresence();

    return () => {
      mounted = false;
      if (channelCleanup) channelCleanup();
    };
  }, [supabase, disciplinaId, frenteId, atividadeId]);

  // Heartbeat enquanto rodando e nÃ£o pausado
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const startHeartbeat = async () => {
      if (!sessaoId) return;
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session) return;
        await fetch('/api/sessao/heartbeat', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ sessao_id: sessaoId }),
        });
      } catch (err) {
        console.warn('[modo-foco] heartbeat falhou', err);
      }
    };

    if (state.running && !state.paused && sessaoId) {
      startHeartbeat();
      timer = setInterval(startHeartbeat, 30000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.running, state.paused, sessaoId, supabase]);

  const iniciarSessao = async () => {
    if (iniciando) return;
    setErro(null);
    if (!disciplinaId) {
      setErro('Selecione uma disciplina para iniciar.');
      return;
    }
    setIniciando(true);
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) {
        throw new Error('SessÃ£o nÃ£o encontrada para iniciar foco');
      }

      const body = {
        disciplina_id: disciplinaId || null,
        frente_id: frenteId || null,
        // Importante: enviar `modulo_id` mesmo sem atividade selecionada,
        // para permitir mÃ©tricas por mÃ³dulo no dashboard.
        modulo_id: moduloId || null,
        atividade_relacionada_id: atividadeId || null,
        metodo_estudo: metodo,
        inicio: new Date().toISOString(),
      };

      const resp = await fetch('/api/sessao/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao iniciar sessÃ£o');
      }

      const { data } = await resp.json();
      setSessaoId(data.id);

      if (metodo === 'timer') {
        start({
          mode: 'timer',
          durationMs: timerMin * 60 * 1000,
          startIso: data.inicio,
        });
      } else if (metodo === 'pomodoro') {
        start({
          mode: 'pomodoro',
          pomodoro: pomodoroConfig,
          startIso: data.inicio,
        });
      } else {
        start({ mode: 'cronometro', startIso: data.inicio });
      }

      await enterCleanView();
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : 'Erro ao iniciar');
    } finally {
      setIniciando(false);
    }
  };

  const finalizarSessao = async () => {
    if (finalizando) return;
    if (!sessaoId) {
      setErro('SessÃ£o ainda nÃ£o iniciada');
      return;
    }
    setErro(null);
    setFinalizando(true);

    try {
      // Garantir que nÃ£o ficaremos presos no overlay/Fullscreen
      await leaveCleanView();
      finalize();
      const snapshot = latestState();
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) {
        throw new Error('SessÃ£o expirada');
      }

      const resp = await fetch('/api/sessao/finalizar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          sessao_id: sessaoId,
          log_pausas: snapshot.logPausas,
          fim: snapshot.lastTickAt ?? new Date().toISOString(),
          nivel_foco: nivelFoco,
          status: 'concluido',
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao finalizar sessÃ£o');
      }

      if (concluiuAtividade && atividadeId) {
        try {
          await fetch(`/api/progresso-atividade/atividade/${atividadeId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({ status: 'Concluido' }),
          });
        } catch (err) {
          console.warn('[modo-foco] Falha ao marcar atividade concluÃ­da', err);
        }
      }

      router.push('/aluno/sala-de-estudos');
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : 'Erro ao finalizar');
    } finally {
      setFinalizando(false);
    }
  };

  const elapsedLabel = formatMs(state.elapsedMs);
  const remainingLabel =
    state.remainingMs !== null ? formatMs(state.remainingMs) : (state.running ? '...' : '-');

  const disabledControls = iniciando || finalizando;

  const minutos = (ms: number) => Math.max(0, Math.round(ms / 60000));
  const cursoNome = cursos.find((c) => c.id === cursoId)?.nome || 'â€”';
  const disciplinaNome = disciplinas.find((d) => d.id === disciplinaId)?.nome || 'â€”';
  const frenteNome = frentes.find((f) => f.id === frenteId)?.nome || 'â€”';
  const moduloNome =
    modulos.find((m) => m.id === moduloId)?.nome ||
    (moduloId ? 'MÃ³dulo selecionado' : 'â€”');
  const atividadeNome = atividades.find((a) => a.id === atividadeId)?.nome || 'â€”';

  const focoRatings = [
    { value: 1, label: 'Socorro' },
    { value: 2, label: 'Precisa melhorar' },
    { value: 3, label: 'TÃ¡ mÃ©dia' },
    { value: 4, label: 'Bom foco' },
    { value: 5, label: 'Eu sou a concentraÃ§Ã£o' },
  ];

  const timeline = useMemo(() => {
    if (!timelineReady || metodo !== 'pomodoro') return { segments: [], totalMs: 0 };
    const cycles = Math.max(1, pomodoroConfig.totalCycles ?? 1);
    const segments: { type: 'focus' | 'short_break' | 'long_break'; label: string; ms: number }[] = [];

    for (let c = 1; c <= cycles; c += 1) {
      segments.push({ type: 'focus', label: `Foco ${c}`, ms: pomodoroConfig.focusMs });
      if (c < cycles) {
        const useLong =
          !!pomodoroConfig.longBreakMs &&
          !!pomodoroConfig.cyclesBeforeLongBreak &&
          c % pomodoroConfig.cyclesBeforeLongBreak === 0;
        const breakMs = useLong
          ? pomodoroConfig.longBreakMs ?? pomodoroConfig.shortBreakMs
          : pomodoroConfig.shortBreakMs;
        segments.push({
          type: useLong ? 'long_break' : 'short_break',
          label: useLong ? 'Pausa longa' : 'Pausa curta',
          ms: breakMs,
        });
      }
    }
    const totalMs = segments.reduce((acc, s) => acc + s.ms, 0);
    return { segments, totalMs };
  }, [metodo, pomodoroConfig, timelineReady]);

  useEffect(() => {
    setTimelineReady(false);
  }, [pomodoroConfig, metodo]);

  return (
    <>
      {isCleanView && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Modo Foco - Tela limpa"
        >
          <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background/60">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1">
                <span className="text-[11px] text-muted-foreground">Foco</span>
                <span className="text-sm font-semibold tabular-nums">{elapsedLabel}</span>
                {(metodo === 'timer' || metodo === 'pomodoro') && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    restante {remainingLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isFullscreen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await requestFullscreenSafe('user');
                    }}
                    aria-label="Entrar em tela cheia"
                  >
                    Entrar em tela cheia
                  </Button>
                )}
                {isFullscreen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      setFullscreenError(null);
                      await exitFullscreenSafe();
                    }}
                    aria-label="Sair da tela cheia"
                  >
                    Sair da tela cheia
                  </Button>
                )}
                {state.running && !state.paused && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pause}
                    disabled={disabledControls}
                    aria-label="Pausar sessÃ£o"
                    autoFocus
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {state.running && state.paused && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resume}
                    disabled={disabledControls}
                    aria-label="Retomar sessÃ£o"
                    autoFocus
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    // Volta para a tela completa e abre o modal de finalizaÃ§Ã£o
                    if (!state.startedAt || !sessaoId) {
                      setErro('Inicie a sessÃ£o antes de encerrar.');
                      await leaveCleanView();
                      return;
                    }
                    await leaveCleanView();
                    setShowFinalizeModal(true);
                  }}
                  disabled={disabledControls || !state.startedAt}
                  aria-label="Encerrar sessÃ£o"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Encerrar
                </Button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 relative">
              {fullscreenError && (
                <div className="absolute bottom-4 left-4 max-w-sm rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <p className="text-xs text-destructive">{fullscreenError}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground absolute bottom-4 right-4">
                Dica: pressione <span className="font-semibold">Esc</span> para sair desta tela sem encerrar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6" aria-hidden={isCleanView}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Modo Foco</h1>
          <p className="page-subtitle">
            Estudo imersivo com worker dedicado e monitoramento de distrações.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          ðŸŸ¢ {presence.count} estudando aqui
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contexto</CardTitle>
          <CardDescription>Selecione disciplina/frente ou use os parâmetros da URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curso">Curso</Label>
              <Select
                value={cursoId || undefined}
                onValueChange={(v) => {
                  setCursoId(v);
                  // Resetar dependentes somente quando o usuÃ¡rio troca manualmente
                  setDisciplinaId('');
                  setFrenteId('');
                  setModuloId('');
                  setAtividadeId('');
                }}
                disabled={carregandoCursos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={carregandoCursos ? 'Carregando...' : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select
                value={disciplinaId || undefined}
                onValueChange={(v) => setDisciplinaId(v)}
                disabled={carregandoDisciplinas || !cursoId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      cursoId
                        ? carregandoDisciplinas
                          ? 'Carregando...'
                          : 'Selecione'
                        : 'Selecione curso'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frente">Frente (opcional)</Label>
              <Select
                value={frenteId || undefined}
                onValueChange={(v) => {
                  setFrenteId(v);
                  // resetar dependentes apenas na troca manual
                  setModuloId('');
                  setAtividades([]);
                  setAtividadeId('');
                }}
                disabled={!disciplinaId || carregandoFrentes}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      disciplinaId
                        ? carregandoFrentes
                          ? 'Carregando...'
                          : 'Selecione'
                        : 'Selecione disciplina'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modulo">MÃ³dulo (opcional)</Label>
              <Select
                value={moduloId || undefined}
                onValueChange={(v) => {
                  setModuloId(v);
                  // resetar atividade ao trocar mÃ³dulo manualmente
                  setAtividadeId('');
                }}
                disabled={!frenteId || carregandoModulos}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      frenteId
                        ? carregandoModulos
                          ? 'Carregando...'
                          : 'Selecione'
                        : 'Selecione frente'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.numero_modulo ? `MÃ³dulo ${m.numero_modulo} - ${m.nome}` : m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="atividade">Atividade relacionada (opcional)</Label>
              <Select
                value={atividadeId || undefined}
                onValueChange={(v) => setAtividadeId(v)}
                disabled={!moduloId || carregandoAtividades}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      moduloId
                        ? carregandoAtividades
                          ? 'Carregando...'
                          : 'Selecione'
                        : 'Selecione mÃ³dulo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {atividades.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {erroCarregamento && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erroCarregamento}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timer</CardTitle>
          <CardDescription>O worker roda fora da main thread.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <Label className="text-sm">Modo</Label>
            <div className="w-full md:max-w-xs">
              <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoEstudo)}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cronometro">CronÃ´metro</SelectItem>
                  <SelectItem value="timer">Timer regressivo</SelectItem>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {metodo === 'timer' && (
            <div className="space-y-2">
              <Label>Minutos (timer)</Label>
              <div className="w-full md:max-w-xs">
                <Input
                  type="number"
                  min={1}
                  value={timerMin}
                  onChange={(e) => setTimerMin(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {metodo === 'pomodoro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Blocos (1 a 5)</Label>
                  <Slider
                    value={[pomodoroConfig.totalCycles ?? 1]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([v]) => setPomodoroConfig((prev) => ({ ...prev, totalCycles: v }))}
                  />
                  <p className="text-xs text-muted-foreground">{pomodoroConfig.totalCycles ?? 1} ciclos</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Foco (minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={minutos(pomodoroConfig.focusMs)}
                    onChange={(e) =>
                      setPomodoroConfig((prev) => ({
                        ...prev,
                        focusMs: Math.max(1, Number(e.target.value) || 0) * 60000,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pausa curta (minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={minutos(pomodoroConfig.shortBreakMs)}
                    onChange={(e) =>
                      setPomodoroConfig((prev) => ({
                        ...prev,
                        shortBreakMs: Math.max(1, Number(e.target.value) || 0) * 60000,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pausa longa (minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={minutos(pomodoroConfig.longBreakMs ?? 15 * 60000)}
                    onChange={(e) =>
                      setPomodoroConfig((prev) => ({
                        ...prev,
                        longBreakMs: Math.max(1, Number(e.target.value) || 0) * 60000,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
                <p className="text-sm text-muted-foreground">
                  Foco {minutos(pomodoroConfig.focusMs)}m Â· Pausa curta {minutos(pomodoroConfig.shortBreakMs)}m Â· Longa{' '}
                  {minutos(pomodoroConfig.longBreakMs ?? 0)}m
                </p>
                <Button variant="secondary" size="sm" onClick={() => setTimelineReady(true)}>
                  ConfiguraÃ§Ã£o pronta (gerar linha do tempo)
                </Button>
              </div>

              {timeline.segments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Linha do tempo</p>
                    <p className="text-xs text-muted-foreground">Ajuste e gere novamente se mudar valores.</p>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <div className="flex w-full items-stretch gap-2">
                      {timeline.segments.map((seg, idx) => {
                        const width =
                          timeline.totalMs > 0 ? `${Math.max(8, (seg.ms / timeline.totalMs) * 100)}%` : '20%';
                        const colors =
                          seg.type === 'focus'
                            ? 'bg-[#60A5FA] text-white' // Azul
                            : seg.type === 'long_break'
                              ? 'bg-[#34D399] text-white' // Verde
                              : 'bg-[#FACC15] text-white'; // Amarelo (pausa curta)
                        return (
                          <div
                            key={`${seg.type}-${idx}`}
                            className={`rounded-sm px-2 py-2 text-xs font-medium text-center ${colors}`}
                            style={{ width, minHeight: '64px' }}
                          >
                            <div className="flex flex-col justify-center h-full">
                              <div className="text-[11px] leading-tight opacity-95">{seg.label}</div>
                              <div className="mt-1 text-base font-extrabold leading-none tabular-nums">
                                {minutos(seg.ms)}m
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#60A5FA]" />
                        Foco
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#FACC15]" />
                        Pausa curta
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#34D399]" />
                        Pausa longa
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold tabular-nums">{elapsedLabel}</div>
              <div className="text-sm text-muted-foreground">
                {metodo === 'timer' || metodo === 'pomodoro' ? `Restante: ${remainingLabel}` : 'Contagem livre'}
                <br />
                {state.phase && (
                  <span className="text-xs">
                    Fase: {state.phase.phase} (ciclo {state.phase.cycle}
                    {state.phase.totalCycles ? `/${state.phase.totalCycles}` : ''})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!state.running && (
                <Button onClick={iniciarSessao} disabled={disabledControls}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              )}
              {state.running && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void enterCleanView();
                  }}
                  disabled={disabledControls}
                >
                  Voltar ao modo clean
                </Button>
              )}
              {state.running && !state.paused && (
                <Button variant="outline" onClick={pause} disabled={disabledControls}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              {state.running && state.paused && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    resume();
                    await enterCleanView();
                  }}
                  disabled={disabledControls}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  if (!state.startedAt || !sessaoId) {
                    setErro('Inicie a sessÃ£o antes de encerrar.');
                    return;
                  }
                  setShowFinalizeModal(true);
                }}
                disabled={disabledControls || !state.startedAt}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Encerrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Encerramento</CardTitle>
          <CardDescription>Feedback rÃ¡pido antes de salvar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border px-3 py-2 text-sm">
            <p className="font-medium">Contexto</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Curso: {cursoNome}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Disciplina: {disciplinaNome}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Frente: {frenteNome}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                MÃ³dulo: {moduloNome}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Atividade: {atividadeNome}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status da sessÃ£o</Label>
              <Input value={sessaoId ? 'Em andamento' : 'NÃ£o iniciada'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>NÃ­vel de foco (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={nivelFoco}
                onChange={(e) => setNivelFoco(Number(e.target.value))}
              />
            </div>
            {atividadeId && (
              <div className="space-y-2">
                <Label>Concluiu a atividade?</Label>
                <Select
                  value={concluiuAtividade ? 'sim' : 'nao'}
                  onValueChange={(v) => setConcluiuAtividade(v === 'sim')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim, concluÃ­</SelectItem>
                    <SelectItem value="nao">Ainda nÃ£o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {erro && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar sessÃ£o</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Como foi o foco?</p>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {focoRatings.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={nivelFoco === opt.value ? 'default' : 'outline'}
                    onClick={() => setNivelFoco(opt.value)}
                    aria-label={`Nota ${opt.value} - ${opt.label}`}
                    className="flex flex-col items-center justify-center py-3 px-2 text-xs gap-1 text-center whitespace-normal leading-tight min-h-20"
                  >
                    <span className="text-base font-semibold">{opt.value}</span>
                    <span className="text-[11px] leading-tight">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            {atividadeId && (
              <div className="space-y-2">
                <Label>Concluiu a atividade?</Label>
                <Select
                  value={concluiuAtividade ? 'sim' : 'nao'}
                  onValueChange={(v) => setConcluiuAtividade(v === 'sim')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim, concluÃ­</SelectItem>
                    <SelectItem value="nao">Ainda nÃ£o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={finalizarSessao} disabled={finalizando}>
              {finalizando ? 'Salvando...' : 'Salvar e encerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
