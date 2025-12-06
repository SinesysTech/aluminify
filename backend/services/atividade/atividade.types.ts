export type TipoAtividade =
  | 'Nivel_1'
  | 'Nivel_2'
  | 'Nivel_3'
  | 'Nivel_4'
  | 'Conceituario'
  | 'Lista_Mista'
  | 'Simulado_Diagnostico'
  | 'Simulado_Cumulativo'
  | 'Simulado_Global'
  | 'Flashcards'
  | 'Revisao';

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
  progressoStatus: 'Pendente' | 'Iniciado' | 'Concluido' | null;
  progressoDataInicio: Date | null;
  progressoDataConclusao: Date | null;
  // Campos de desempenho (quando concluído com check qualificado)
  questoesTotais: number | null;
  questoesAcertos: number | null;
  dificuldadePercebida: 'Muito Facil' | 'Facil' | 'Medio' | 'Dificil' | 'Muito Dificil' | null;
  anotacoesPessoais: string | null;
}

// Helper para verificar se um tipo de atividade requer check qualificado (modal de desempenho)
export function atividadeRequerDesempenho(tipo: TipoAtividade): boolean {
  // Check simples: Revisao e Conceituario
  // Check qualificado: Todos os outros tipos
  return tipo !== 'Revisao' && tipo !== 'Conceituario';
}

