import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { TurmaRepositoryImpl, type TurmaRepository } from "./turma.repository";
import type {
  Turma,
  TurmaSummary,
  TurmaWithCurso,
  CreateTurmaInput,
  UpdateTurmaInput,
  AlunoNaTurma,
  AlunoTurmaStatus,
  ListTurmasFilters,
} from "./turma.types";

export interface TurmaService {
  list(filters?: ListTurmasFilters): Promise<TurmaSummary[]>;
  listByEmpresa(): Promise<TurmaWithCurso[]>;
  listByCurso(cursoId: string): Promise<TurmaSummary[]>;
  getById(id: string): Promise<Turma | null>;
  create(input: CreateTurmaInput): Promise<Turma>;
  update(id: string, input: UpdateTurmaInput): Promise<Turma>;
  delete(id: string): Promise<void>;
  getAlunosDaTurma(turmaId: string): Promise<AlunoNaTurma[]>;
  vincularAluno(turmaId: string, alunoId: string, dataEntrada?: string): Promise<void>;
  vincularAlunos(turmaId: string, alunoIds: string[]): Promise<{ success: number; failed: number }>;
  desvincularAluno(turmaId: string, alunoId: string, status?: AlunoTurmaStatus): Promise<void>;
}

export class TurmaServiceImpl implements TurmaService {
  private repository: TurmaRepository;

  constructor(private readonly client: SupabaseClient<Database>) {
    this.repository = new TurmaRepositoryImpl(client);
  }

  async list(filters?: ListTurmasFilters): Promise<TurmaSummary[]> {
    return this.repository.list(filters);
  }

  async listByEmpresa(): Promise<TurmaWithCurso[]> {
    return this.repository.listByEmpresa();
  }

  async listByCurso(cursoId: string): Promise<TurmaSummary[]> {
    return this.repository.listByCurso(cursoId);
  }

  async getById(id: string): Promise<Turma | null> {
    return this.repository.getById(id);
  }

  async create(input: CreateTurmaInput): Promise<Turma> {
    // Validate curso exists and get empresa_id
    const empresaId = await this.repository.getCursoEmpresaId(input.cursoId);

    if (!empresaId) {
      throw new Error("Curso não encontrado");
    }

    // Validate required fields
    if (!input.nome || input.nome.trim().length === 0) {
      throw new Error("Nome da turma é obrigatório");
    }

    // Validate dates if both provided
    if (input.dataInicio && input.dataFim) {
      const inicio = new Date(input.dataInicio);
      const fim = new Date(input.dataFim);
      if (fim < inicio) {
        throw new Error("Data de fim não pode ser anterior à data de início");
      }
    }

    return this.repository.create(input, empresaId);
  }

  async update(id: string, input: UpdateTurmaInput): Promise<Turma> {
    // Check turma exists
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    // Validate dates if provided
    const dataInicio = input.dataInicio ?? existing.dataInicio;
    const dataFim = input.dataFim ?? existing.dataFim;

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      if (fim < inicio) {
        throw new Error("Data de fim não pode ser anterior à data de início");
      }
    }

    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    // Check turma exists
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    return this.repository.delete(id);
  }

  async getAlunosDaTurma(turmaId: string): Promise<AlunoNaTurma[]> {
    // Check turma exists
    const existing = await this.repository.getById(turmaId);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    return this.repository.getAlunosDaTurma(turmaId);
  }

  async vincularAluno(turmaId: string, alunoId: string, dataEntrada?: string): Promise<void> {
    // Check turma exists
    const existing = await this.repository.getById(turmaId);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    return this.repository.vincularAluno(turmaId, alunoId, dataEntrada);
  }

  async vincularAlunos(turmaId: string, alunoIds: string[]): Promise<{ success: number; failed: number }> {
    // Check turma exists
    const existing = await this.repository.getById(turmaId);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    let success = 0;
    let failed = 0;

    for (const alunoId of alunoIds) {
      try {
        await this.repository.vincularAluno(turmaId, alunoId);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  async desvincularAluno(turmaId: string, alunoId: string, status?: AlunoTurmaStatus): Promise<void> {
    // Check turma exists
    const existing = await this.repository.getById(turmaId);
    if (!existing) {
      throw new Error("Turma não encontrada");
    }

    return this.repository.desvincularAluno(turmaId, alunoId, status);
  }
}

export function createTurmaService(client: SupabaseClient<Database>): TurmaService {
  return new TurmaServiceImpl(client);
}
