export type Option = {
  id: string;
  nome: string;
};

export type ModuloOption = {
  id: string;
  nome: string;
  numero_modulo: number | null;
};

export type PresenceCounter = {
  count: number;
  channel: string;
};

export const POMODORO_DEFAULT = {
  focusMs: 25 * 60 * 1000,
  shortBreakMs: 5 * 60 * 1000,
  longBreakMs: 15 * 60 * 1000,
  cyclesBeforeLongBreak: 4,
  totalCycles: 4,
};

export const FOCUS_CONTEXT_STORAGE_KEY = "modo-foco:context";
