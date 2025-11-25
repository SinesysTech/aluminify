export interface FeriasPeriodo {
  inicio: string;
  fim: string;
}

export interface GerarCronogramaInput {
  aluno_id: string;
  data_inicio: string;
  data_fim: string;
  ferias: FeriasPeriodo[];
  horas_dia: number;
  dias_semana: number;
  prioridade_minima: number;
  disciplinas_ids: string[];
  modalidade: 'paralelo' | 'sequencial';
  curso_alvo_id?: string;
  nome?: string;
  ordem_frentes_preferencia?: string[];
  modulos_ids?: string[];
  excluir_aulas_concluidas?: boolean;
  velocidade_reproducao?: number; // 1.00, 1.25, 1.50, 2.00
}

export interface AulaCompleta {
  id: string;
  nome: string;
  numero_aula: number | null;
  tempo_estimado_minutos: number | null;
  prioridade: number | null;
  modulo_id: string;
  modulo_nome: string;
  numero_modulo: number | null;
  frente_id: string;
  frente_nome: string;
  disciplina_id: string;
  disciplina_nome: string;
}

export interface FrenteDistribuicao {
  frente_id: string;
  frente_nome: string;
  aulas: AulaCompleta[];
  custo_total: number;
  peso: number;
}

export interface SemanaInfo {
  numero: number;
  data_inicio: Date;
  data_fim: Date;
  is_ferias: boolean;
  capacidade_minutos: number;
}

export interface ItemDistribuicao {
  cronograma_id: string;
  aula_id: string;
  semana_numero: number;
  ordem_na_semana: number;
}

export interface CronogramaEstatisticas {
  total_aulas: number;
  total_semanas: number;
  semanas_uteis: number;
  capacidade_total_minutos: number;
  custo_total_minutos: number;
  frentes_distribuidas: number;
}

export interface GerarCronogramaResult {
  success: true;
  cronograma: any;
  estatisticas: CronogramaEstatisticas;
}

export interface TempoInsuficienteDetalhes {
  horas_necessarias: number;
  horas_disponiveis: number;
  horas_dia_necessarias: number;
  horas_dia_atual: number;
}

