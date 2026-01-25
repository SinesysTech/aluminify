import type { Database } from "@/app/shared/core/database.types";

export type TurmaRow = Database["public"]["Tables"]["turmas"]["Row"];
export type TurmaInsert = Database["public"]["Tables"]["turmas"]["Insert"];
export type TurmaUpdate = Database["public"]["Tables"]["turmas"]["Update"];

export type AlunoTurmaRow = Database["public"]["Tables"]["alunos_turmas"]["Row"];
export type AlunoTurmaInsert = Database["public"]["Tables"]["alunos_turmas"]["Insert"];
export type AlunoTurmaStatus = Database["public"]["Enums"]["enum_status_aluno_turma"];

export interface Turma {
  id: string;
  cursoId: string;
  empresaId: string;
  nome: string;
  dataInicio: string | null;
  dataFim: string | null;
  acessoAposTermino: boolean;
  diasAcessoExtra: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TurmaSummary {
  id: string;
  nome: string;
  cursoId: string;
  ativo: boolean;
  alunosCount?: number;
}

export interface TurmaWithCurso extends Turma {
  cursoNome: string;
}

export interface CreateTurmaInput {
  cursoId: string;
  nome: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  acessoAposTermino?: boolean;
  diasAcessoExtra?: number;
}

export interface UpdateTurmaInput {
  nome?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  acessoAposTermino?: boolean;
  diasAcessoExtra?: number;
  ativo?: boolean;
}

export interface AlunoTurma {
  alunoId: string;
  turmaId: string;
  dataEntrada: string | null;
  dataSaida: string | null;
  status: AlunoTurmaStatus | null;
  createdAt: string | null;
}

export interface AlunoNaTurma {
  id: string;
  nomeCompleto: string | null;
  email: string;
  status: AlunoTurmaStatus | null;
  dataEntrada: string | null;
}

export interface VincularAlunoInput {
  alunoId: string;
  turmaId: string;
  dataEntrada?: string;
}

export interface DesvincularAlunoInput {
  alunoId: string;
  turmaId: string;
  status?: AlunoTurmaStatus;
}

export interface ListTurmasFilters {
  cursoId?: string;
  ativo?: boolean;
}
