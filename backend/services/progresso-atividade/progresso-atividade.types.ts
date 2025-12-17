/**
 * @deprecated Use types from '@/types/shared/enums' instead
 * This file re-exports for backward compatibility
 */
export type {
  StatusAtividade,
  DificuldadePercebida,
} from '@/types/shared/enums';

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



