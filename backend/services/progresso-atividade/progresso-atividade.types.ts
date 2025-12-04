export type StatusAtividade = 'Pendente' | 'Iniciado' | 'Concluido';

export type DificuldadePercebida =
  | 'Muito Facil'
  | 'Facil'
  | 'Medio'
  | 'Dificil'
  | 'Muito Dificil';

export interface ProgressoAtividade {
  id: string;
  alunoId: string;
  atividadeId: string;
  status: StatusAtividade;
  dataInicio: Date | null;
  dataConclusao: Date | null;
  questoesTotais: number;
  questoesAcertos: number;
  dificuldadePercebida: DificuldadePercebida | null;
  anotacoesPessoais: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgressoInput {
  alunoId: string;
  atividadeId: string;
  status?: StatusAtividade;
  dataInicio?: Date | null;
  dataConclusao?: Date | null;
  questoesTotais?: number;
  questoesAcertos?: number;
  dificuldadePercebida?: DificuldadePercebida | null;
  anotacoesPessoais?: string | null;
}

export interface UpdateProgressoInput {
  status?: StatusAtividade;
  dataInicio?: Date | null;
  dataConclusao?: Date | null;
  questoesTotais?: number;
  questoesAcertos?: number;
  dificuldadePercebida?: DificuldadePercebida | null;
  anotacoesPessoais?: string | null;
}

