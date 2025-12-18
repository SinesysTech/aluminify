import { useEffect, useRef, useState } from 'react';
import { LogPausa, MetodoEstudo } from '@/types/sessao-estudo';

type Phase = 'focus' | 'short_break' | 'long_break';

type PomodoroState = {
  phase: Phase;
  cycle: number;
  totalCycles: number | null;
};

export type TimerConfig = {
  mode: MetodoEstudo;
  durationMs?: number; // modo timer
  pomodoro?: {
    focusMs: number;
    shortBreakMs: number;
    longBreakMs?: number;
    cyclesBeforeLongBreak?: number;
    totalCycles?: number;
  };
  startIso?: string;
};

export type StudyTimerState = {
  mode: MetodoEstudo;
  running: boolean;
  paused: boolean;
  phase?: PomodoroState;
  elapsedMs: number;
  remainingMs: number | null;
  logPausas: LogPausa[];
  startedAt: string | null;
  lastTickAt: string | null;
};

type WorkerMessage =
  | {
      type: 'TICK' | 'STATE' | 'FINALIZED';
      state: StudyTimerState;
    }
  | { type: string };

const initialState: StudyTimerState = {
  mode: 'cronometro',
  running: false,
  paused: false,
  phase: undefined,
  elapsedMs: 0,
  remainingMs: null,
  logPausas: [],
  startedAt: null,
  lastTickAt: null,
};

function playBeep() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    console.warn('[focus-mode] Falha ao tocar alerta sonoro', err);
  }
}

export function useStudyTimer() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<StudyTimerState>(initialState);
  const distractedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const worker = new Worker(new URL('../workers/study-timer.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg && 'state' in msg) {
        setState(msg.state);
      }
    };

    workerRef.current = worker;
    worker.postMessage({ type: 'REQUEST_STATE' });

    const onVisibilityChange = () => {
      if (!workerRef.current) return;
      if (document.visibilityState === 'hidden') {
        distractedRef.current = true;
        workerRef.current.postMessage({ type: 'DISTRACTION_START', at: new Date().toISOString() });
        playBeep();
      } else if (distractedRef.current) {
        workerRef.current.postMessage({ type: 'DISTRACTION_END', at: new Date().toISOString() });
        distractedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const start = (config: TimerConfig) => {
    workerRef.current?.postMessage({ type: 'INIT', payload: config });
  };

  const pause = () => workerRef.current?.postMessage({ type: 'PAUSE', at: new Date().toISOString() });
  const resume = () =>
    workerRef.current?.postMessage({ type: 'RESUME', at: new Date().toISOString() });
  const finalize = () =>
    workerRef.current?.postMessage({ type: 'FINALIZE', at: new Date().toISOString() });

  const latestState = () => state;

  return {
    state,
    start,
    pause,
    resume,
    finalize,
    latestState,
  };
}




















