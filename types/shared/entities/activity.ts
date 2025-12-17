/**
 * Tipos de entidades de atividade compartilhados
 */

import type { TipoAtividade, StatusAtividade, DificuldadePercebida } from '../enums';

export interface Atividade {
  id: string;
  moduloId: string;
  tipo: TipoAtividade;
  titulo: string;
  arquivoUrl: string | null;
  gabaritoUrl: string | null;
  linkExterno: string | null;
  obrigatorio: boolean;
  ordemExibicao: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAtividadeInput {
  moduloId: string;
  tipo: TipoAtividade;
  titulo: string;
  arquivoUrl?: string | null;
  gabaritoUrl?: string | null;
  linkExterno?: string | null;
  obrigatorio?: boolean;
  ordemExibicao?: number;
}

export interface UpdateAtividadeInput {
  arquivoUrl?: string | null;
  gabaritoUrl?: string | null;
  linkExterno?: string | null;
  titulo?: string;
  obrigatorio?: boolean;
  ordemExibicao?: number;
}

// Tipo para retorno de atividades do aluno (com informações hierárquicas e progresso)
export interface AtividadeComProgressoEHierarquia extends Atividade {
  moduloNome: string;
  moduloNumero: number | null;
  frenteNome: string;
  frenteId: string;
  disciplinaNome: string;
  disciplinaId: string;
  cursoNome: string;
  cursoId: string;
  progressoStatus: StatusAtividade | null;
  progressoDataInicio: Date | null;
  progressoDataConclusao: Date | null;
  // Campos de desempenho (quando concluído com check qualificado)
  questoesTotais: number | null;
  questoesAcertos: number | null;
  dificuldadePercebida: DificuldadePercebida | null;
  anotacoesPessoais: string | null;
}

// Helper para verificar se um tipo de atividade requer check qualificado (modal de desempenho)
export function atividadeRequerDesempenho(tipo: TipoAtividade): boolean {
  // Check simples: Revisao e Conceituario
  // Check qualificado: Todos os outros tipos
  return tipo !== 'Revisao' && tipo !== 'Conceituario';
}

// Tipos de sessão de estudo
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

