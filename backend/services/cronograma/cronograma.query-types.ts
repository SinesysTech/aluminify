/**
 * Tipos específicos para resultados de queries do Supabase
 * Usados no serviço de cronograma para evitar uso de 'any'
 */

/**
 * Estrutura de disciplina retornada em queries aninhadas
 * id é opcional pois algumas queries selecionam apenas nome
 */
export interface DisciplinaQueryResult {
  id?: string;
  nome: string;
}

/**
 * Estrutura de frente retornada em queries aninhadas
 * disciplinas pode ser objeto ou array dependendo da query
 */
export interface FrenteQueryResult {
  id?: string;
  nome: string;
  curso_id?: string | null;
  disciplina_id?: string | null;
  disciplinas?: DisciplinaQueryResult | DisciplinaQueryResult[];
}

/**
 * Estrutura de módulo retornada em queries aninhadas
 * Campos são opcionais pois diferentes queries selecionam campos diferentes
 */
export interface ModuloQueryResult {
  id: string;
  nome?: string;
  numero_modulo?: number | null;
  frente_id?: string | null;
  modulo_id?: string;
  curso_id?: string | null;
  frentes?: FrenteQueryResult | FrenteQueryResult[];
}

/**
 * Estrutura de aula retornada em queries com joins completos
 * modulos pode ser objeto ou array dependendo da query do Supabase
 */
export interface AulaQueryResult {
  id: string;
  nome: string;
  numero_aula?: number | null;
  tempo_estimado_minutos?: number | null;
  prioridade?: number | null;
  modulo_id?: string;
  modulos?: ModuloQueryResult | ModuloQueryResult[];
}

/**
 * Acumulador para estatísticas de frentes
 */
export interface FrenteStatsAccumulator {
  [frenteId: string]: {
    frente_nome: string;
    total: number;
    curso_ids: Set<string>;
  };
}

/**
 * Acumulador simples para contagem de frentes
 */
export interface FrenteCountAccumulator {
  [frenteId: string]: {
    frente_nome: string;
    total: number;
  };
}

/**
 * Acumulador para frentes com curso diferente
 */
export interface FrenteComCursoDiferenteAccumulator {
  [frenteId: string]: {
    frente_nome: string;
    curso_id: string | null;
    total: number;
  };
}

/**
 * Estrutura de validação de frente com disciplina
 */
export interface FrenteValidacaoResult {
  id: string;
  nome: string;
  disciplina_id: string;
  curso_id: string | null;
  disciplinas?: DisciplinaQueryResult | DisciplinaQueryResult[];
}

/**
 * Acumulador para itens por semana
 */
export interface ItensPorSemanaAccumulator {
  [semanaNumero: number]: number;
}

/**
 * Resultado mapeado de frente com estatísticas
 */
export interface FrenteComEstatisticas {
  frente_id: string;
  frente_nome: string;
  curso_id: string | null;
  total_aulas: number;
  prioridade_maior_igual_1: number;
  sera_incluida: boolean;
}

export interface DiagnosticoFrente {
  frente: {
    id?: string;
    nome?: string;
    disciplina?: string;
    curso_id?: string | null;
  };
  modulos: Array<{
    id: string;
    nome: string;
    curso_id: string | null;
  }>;
}

export interface FrenteInfo {
  id: string;
  nome: string;
  disciplina?: string;
  curso_id?: string | null;
}

export interface ModuloInfo {
  id: string;
  nome: string;
  curso_id: string | null;
}

/**
 * Estrutura de frente aninhada em módulo selecionado
 */
export interface FrenteNestedInModulo {
  id?: string;
  nome?: string;
  curso_id?: string | null;
  disciplinas?: { id?: string; nome?: string } | { id?: string; nome?: string }[];
}

export interface ModuloSelecionadoQueryResult {
  id: string;
  frente_id: string;
  curso_id: string | null;
  frentes?: FrenteNestedInModulo | FrenteNestedInModulo[];
}

/**
 * Helper functions para acessar propriedades aninhadas de forma segura
 * Supabase pode retornar objeto único ou array dependendo da query
 */

/**
 * Extrai o primeiro item de um valor que pode ser objeto ou array
 */
export function getFirst<T>(value: T | T[] | undefined): T | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Extrai o nome da disciplina de forma segura
 */
export function getDisciplinaNome(
  disciplinas: DisciplinaQueryResult | DisciplinaQueryResult[] | undefined
): string | undefined {
  const disc = getFirst(disciplinas);
  return disc?.nome;
}

/**
 * Extrai as propriedades da frente de forma segura
 */
export function getFrenteInfo(
  frentes: FrenteQueryResult | FrenteQueryResult[] | undefined
): FrenteQueryResult | undefined {
  return getFirst(frentes);
}

/**
 * Extrai as propriedades do módulo de forma segura
 */
export function getModuloInfo(
  modulos: ModuloQueryResult | ModuloQueryResult[] | undefined
): ModuloQueryResult | undefined {
  return getFirst(modulos);
}
