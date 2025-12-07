import { LogPausa, MetodoEstudo } from '@/types/sessao-estudo';

type TimerMode = MetodoEstudo;

type Phase = 'focus' | 'short_break' | 'long_break';

type IncomingMessage =
  | { type: 'INIT'; payload: InitPayload }
  | { type: 'PAUSE'; at?: string }
  | { type: 'RESUME'; at?: string }
  | { type: 'DISTRACTION_START'; at?: string }
  | { type: 'DISTRACTION_END'; at?: string }
  | { type: 'FINALIZE'; at?: string }
  | { type: 'REQUEST_STATE' };

type InitPayload = {
  mode: TimerMode;
  durationMs?: number; // para modo timer
  pomodoro?: {
    focusMs: number;
    shortBreakMs: number;
    longBreakMs?: number;
    cyclesBeforeLongBreak?: number;
    totalCycles?: number;
  };
  startIso?: string;
};

type OutgoingMessage =
  | { type: 'TICK'; state: TimerState }
  | { type: 'STATE'; state: TimerState }
  | { type: 'FINALIZED'; state: TimerState };

type PomodoroState = {
  phase: Phase;
  cycle: number; // começa em 1
  totalCycles: number | null;
};

type TimerState = {
  mode: TimerMode;
  running: boolean;
  paused: boolean;
  phase?: PomodoroState;
  elapsedMs: number;
  remainingMs: number | null;
  logPausas: LogPausa[];
  startedAt: string | null;
  lastTickAt: string | null;
};

let mode: TimerMode = 'cronometro';
let running = false;
let paused = false;
let startedAtMs: number | null = null;
let lastTickMs: number | null = null;
let elapsedMs = 0; // não inclui pausas manuais
let durationMs: number | null = null;
let intervalId: number | null = null;
let logPausas: LogPausa[] = [];
let pauseStartMs: number | null = null;
let distractionStartMs: number | null = null;

// Pomodoro
let phase: PomodoroState | undefined = undefined;
let phaseStartMs: number | null = null;
let phaseDurationMs: number | null = null;
let pomodoroConfig: InitPayload['pomodoro'] | null = null;

function ensureInterval() {
  if (intervalId !== null) return;
  intervalId = self.setInterval(onTick, 1000);
}

function clearIntervalSafe() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function nowMs(fromIso?: string): number {
  return fromIso ? Date.parse(fromIso) : Date.now();
}

function pushPause(start: number, end: number, tipo: LogPausa['tipo']) {
  if (end <= start) return;
  logPausas.push({
    inicio: new Date(start).toISOString(),
    fim: new Date(end).toISOString(),
    tipo,
  });
}

function startInterval() {
  running = true;
  paused = false;
  ensureInterval();
}

function stopInterval() {
  running = false;
  clearIntervalSafe();
}

function handleInit(payload: InitPayload) {
  mode = payload.mode;
  durationMs = payload.durationMs ?? null;
  pomodoroConfig = payload.pomodoro ?? null;
  startedAtMs = nowMs(payload.startIso);
  lastTickMs = startedAtMs;
  elapsedMs = 0;
  logPausas = [];
  pauseStartMs = null;
  distractionStartMs = null;

  if (mode === 'pomodoro' && pomodoroConfig) {
    phase = { phase: 'focus', cycle: 1, totalCycles: pomodoroConfig.totalCycles ?? null };
    phaseDurationMs = pomodoroConfig.focusMs;
  } else {
    phase = undefined;
    phaseDurationMs = null;
  }
  phaseStartMs = startedAtMs;

  startInterval();
  emitState('STATE');
}

function handlePause(at?: string) {
  if (!running || paused) return;
  const ts = nowMs(at);
  paused = true;
  pauseStartMs = ts;
  lastTickMs = ts;
}

function handleResume(at?: string) {
  if (!running || !paused) return;
  const ts = nowMs(at);
  if (pauseStartMs) {
    pushPause(pauseStartMs, ts, 'manual');
  }
  paused = false;
  pauseStartMs = null;
  lastTickMs = ts;
}

function handleDistractionStart(at?: string) {
  if (distractionStartMs !== null) return;
  distractionStartMs = nowMs(at);
}

function handleDistractionEnd(at?: string) {
  if (distractionStartMs === null) return;
  const end = nowMs(at);
  pushPause(distractionStartMs, end, 'distracao');
  distractionStartMs = null;
}

function handleFinalize(at?: string) {
  const ts = nowMs(at);
  // fecha pausas abertas
  if (pauseStartMs) {
    pushPause(pauseStartMs, ts, 'manual');
    pauseStartMs = null;
  }
  if (distractionStartMs) {
    pushPause(distractionStartMs, ts, 'distracao');
    distractionStartMs = null;
  }
  lastTickMs = ts;
  onTick(ts); // último tick
  stopInterval();
  emitState('FINALIZED');
}

function advancePomodoroPhase(deltaMs: number) {
  if (!phase || !phaseDurationMs || phaseStartMs === null) return;
  const elapsedPhase = lastTickMs! - phaseStartMs;
  if (elapsedPhase + deltaMs < phaseDurationMs) return;

  const cfg = pomodoroConfig!;
  // compute next phase
  if (phase.phase === 'focus') {
    const cycle = phase.cycle;
    const isLongBreak =
      cfg.longBreakMs &&
      cfg.cyclesBeforeLongBreak &&
      cycle % cfg.cyclesBeforeLongBreak === 0 &&
      cycle !== 0;

    phase = {
      phase: isLongBreak ? 'long_break' : 'short_break',
      cycle,
      totalCycles: phase.totalCycles,
    };
    phaseDurationMs = isLongBreak ? cfg.longBreakMs ?? cfg.shortBreakMs : cfg.shortBreakMs;
  } else {
    const nextCycle = phase.cycle + 1;
    phase = { phase: 'focus', cycle: nextCycle, totalCycles: phase.totalCycles };
    phaseDurationMs = cfg.focusMs;
  }
  phaseStartMs = lastTickMs;
}

function onTick(tsOverride?: number) {
  if (!running || paused || startedAtMs === null) {
    emitState('TICK');
    return;
  }

  const now = tsOverride ?? Date.now();
  if (lastTickMs === null) {
    lastTickMs = now;
  }
  const delta = now - lastTickMs;
  if (delta <= 0) {
    emitState('TICK');
    return;
  }

  if (mode === 'pomodoro' && phase) {
    advancePomodoroPhase(delta);
  }

  elapsedMs += delta;
  lastTickMs = now;

  if (mode === 'timer' && durationMs !== null && elapsedMs >= durationMs) {
    elapsedMs = durationMs;
    emitState('TICK');
    handleFinalize(new Date(now).toISOString());
    return;
  }

  emitState('TICK');
}

function computeRemainingMs(): number | null {
  if (mode === 'timer' && durationMs !== null) {
    return Math.max(0, durationMs - elapsedMs);
  }
  if (mode === 'pomodoro' && phaseDurationMs !== null && phaseStartMs !== null) {
    const elapsedPhase = Math.max(0, (lastTickMs ?? Date.now()) - phaseStartMs);
    return Math.max(0, phaseDurationMs - elapsedPhase);
  }
  return null;
}

function emitState(type: OutgoingMessage['type']) {
  const state: TimerState = {
    mode,
    running,
    paused,
    phase,
    elapsedMs,
    remainingMs: computeRemainingMs(),
    logPausas,
    startedAt: startedAtMs ? new Date(startedAtMs).toISOString() : null,
    lastTickAt: lastTickMs ? new Date(lastTickMs).toISOString() : null,
  };

  self.postMessage({ type, state } satisfies OutgoingMessage);
}

self.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const { data } = event;
  switch (data.type) {
    case 'INIT':
      handleInit(data.payload);
      break;
    case 'PAUSE':
      handlePause(data.at);
      break;
    case 'RESUME':
      handleResume(data.at);
      break;
    case 'DISTRACTION_START':
      handleDistractionStart(data.at);
      break;
    case 'DISTRACTION_END':
      handleDistractionEnd(data.at);
      break;
    case 'FINALIZE':
      handleFinalize(data.at);
      break;
    case 'REQUEST_STATE':
      emitState('STATE');
      break;
    default:
      break;
  }
};

export {};




