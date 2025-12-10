export type MetodoEstudo = 'pomodoro' | 'cronometro' | 'timer';

export type LogPausaTipo = 'manual' | 'distracao';

export interface LogPausa {
  inicio: string; // ISO string
  fim: string; // ISO string
  tipo: LogPausaTipo;
}

export type SessaoStatus = 'em_andamento' | 'concluido' | 'descartado';

export interface SessaoEstudo {
  id: string;
  alunoId: string;
  disciplinaId: string | null;
  frenteId: string | null;
  atividadeRelacionadaId: string | null;
  inicio: string;
  fim: string | null;
  tempoTotalBrutoSegundos: number | null;
  tempoTotalLiquidoSegundos: number | null;
  logPausas: LogPausa[];
  metodoEstudo: MetodoEstudo | null;
  nivelFoco: number | null;
  status: SessaoStatus;
  createdAt: string;
}

export interface IniciarSessaoInput {
  disciplinaId?: string;
  frenteId?: string;
  atividadeRelacionadaId?: string;
  metodoEstudo?: MetodoEstudo;
  inicioIso?: string; // permite iniciar com horário vindo do worker
}

export interface FinalizarSessaoInput {
  sessaoId: string;
  logPausas: LogPausa[];
  fimIso?: string; // horário final vindo do worker; fallback para now
  nivelFoco?: number;
  status?: Extract<SessaoStatus, 'concluido' | 'descartado'>;
}

export interface CalculoTempoResultado {
  tempoTotalBrutoSegundos: number;
  tempoTotalLiquidoSegundos: number;
}













