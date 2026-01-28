/**
 * @deprecated Use types from '@/app/shared/types/enums' instead
 * This file re-exports for backward compatibility
 */
import type {
  StatusAtividade,
  DificuldadePercebida,
} from '@/app/shared/types/enums';

export type { StatusAtividade, DificuldadePercebida };

export interface ProgressoAtividade {
  id: string;
  alunoId: string;
  atividadeId: string;
  /** Empresa/organização do conteúdo (multi-tenant / multi-org). */
  empresaId: string | null;
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
  /** Define a empresa vinculada a este progresso. */
  empresaId?: string | null;
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
  /** Atualiza a empresa vinculada a este progresso. */
  empresaId?: string | null;
}



