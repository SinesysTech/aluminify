import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type {
  Turma,
  TurmaSummary,
  TurmaWithCurso,
  CreateTurmaInput,
  UpdateTurmaInput,
  AlunoNaTurma,
  AlunoTurmaStatus,
  ListTurmasFilters,
  TurmaRow,
} from "./turma.types";

const TURMAS_TABLE = "turmas";
const ALUNOS_TURMAS_TABLE = "alunos_turmas";
const ALUNOS_TABLE = "alunos";
const CURSOS_TABLE = "cursos";

export interface TurmaRepository {
  list(filters?: ListTurmasFilters): Promise<TurmaSummary[]>;
  listByEmpresa(): Promise<TurmaWithCurso[]>;
  listByCurso(cursoId: string): Promise<TurmaSummary[]>;
  getById(id: string): Promise<Turma | null>;
  create(input: CreateTurmaInput, empresaId: string): Promise<Turma>;
  update(id: string, input: UpdateTurmaInput): Promise<Turma>;
  delete(id: string): Promise<void>;
  getAlunosDaTurma(turmaId: string): Promise<AlunoNaTurma[]>;
  vincularAluno(turmaId: string, alunoId: string, dataEntrada?: string): Promise<void>;
  desvincularAluno(turmaId: string, alunoId: string, status?: AlunoTurmaStatus): Promise<void>;
  countAlunosByTurma(turmaIds: string[]): Promise<Record<string, number>>;
  getCursoEmpresaId(cursoId: string): Promise<string | null>;
}

export class TurmaRepositoryImpl implements TurmaRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  private mapRowToTurma(row: TurmaRow): Turma {
    return {
      id: row.id,
      cursoId: row.curso_id,
      empresaId: row.empresa_id,
      nome: row.nome,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      acessoAposTermino: row.acesso_apos_termino ?? false,
      diasAcessoExtra: row.dias_acesso_extra ?? 0,
      ativo: row.ativo ?? true,
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString(),
    };
  }

  async list(filters?: ListTurmasFilters): Promise<TurmaSummary[]> {
    let query = this.client
      .from(TURMAS_TABLE)
      .select("id, nome, curso_id, ativo")
      .order("nome", { ascending: true });

    if (filters?.cursoId) {
      query = query.eq("curso_id", filters.cursoId);
    }

    if (filters?.ativo !== undefined) {
      query = query.eq("ativo", filters.ativo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list turmas: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      nome: row.nome,
      cursoId: row.curso_id,
      ativo: row.ativo ?? true,
    }));
  }

  async listByEmpresa(): Promise<TurmaWithCurso[]> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select(`
        id,
        nome,
        curso_id,
        empresa_id,
        data_inicio,
        data_fim,
        acesso_apos_termino,
        dias_acesso_extra,
        ativo,
        created_at,
        updated_at,
        cursos!inner(nome)
      `)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to list turmas by empresa: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      cursoId: row.curso_id,
      empresaId: row.empresa_id,
      nome: row.nome,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      acessoAposTermino: row.acesso_apos_termino ?? false,
      diasAcessoExtra: row.dias_acesso_extra ?? 0,
      ativo: row.ativo ?? true,
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString(),
      cursoNome: (row.cursos as { nome: string })?.nome ?? "",
    }));
  }

  async listByCurso(cursoId: string): Promise<TurmaSummary[]> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select("id, nome, curso_id, ativo")
      .eq("curso_id", cursoId)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to list turmas for course: ${error.message}`);
    }

    // Get counts
    const turmaIds = (data ?? []).map((t) => t.id);
    const counts = turmaIds.length > 0 ? await this.countAlunosByTurma(turmaIds) : {};

    return (data ?? []).map((row) => ({
      id: row.id,
      nome: row.nome,
      cursoId: row.curso_id,
      ativo: row.ativo ?? true,
      alunosCount: counts[row.id] ?? 0,
    }));
  }

  async getById(id: string): Promise<Turma | null> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get turma: ${error.message}`);
    }

    return this.mapRowToTurma(data);
  }

  async create(input: CreateTurmaInput, empresaId: string): Promise<Turma> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .insert({
        curso_id: input.cursoId,
        empresa_id: empresaId,
        nome: input.nome,
        data_inicio: input.dataInicio ?? null,
        data_fim: input.dataFim ?? null,
        acesso_apos_termino: input.acessoAposTermino ?? false,
        dias_acesso_extra: input.diasAcessoExtra ?? 0,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create turma: ${error.message}`);
    }

    return this.mapRowToTurma(data);
  }

  async update(id: string, input: UpdateTurmaInput): Promise<Turma> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.nome !== undefined) updateData.nome = input.nome;
    if (input.dataInicio !== undefined) updateData.data_inicio = input.dataInicio;
    if (input.dataFim !== undefined) updateData.data_fim = input.dataFim;
    if (input.acessoAposTermino !== undefined) updateData.acesso_apos_termino = input.acessoAposTermino;
    if (input.diasAcessoExtra !== undefined) updateData.dias_acesso_extra = input.diasAcessoExtra;
    if (input.ativo !== undefined) updateData.ativo = input.ativo;

    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update turma: ${error.message}`);
    }

    return this.mapRowToTurma(data);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - set ativo = false
    const { error } = await this.client
      .from(TURMAS_TABLE)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete turma: ${error.message}`);
    }
  }

  async getAlunosDaTurma(turmaId: string): Promise<AlunoNaTurma[]> {
    const { data: links, error: linksError } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .select("usuario_id, status, data_entrada")
      .eq("turma_id", turmaId)
      .eq("status", "ativo");

    if (linksError) {
      throw new Error(`Failed to get alunos da turma: ${linksError.message}`);
    }

    if (!links || links.length === 0) {
      return [];
    }

    const alunoIds = links.map((l) => l.usuario_id);
    const linksMap = new Map(links.map((l) => [l.usuario_id, l]));

    const { data: alunos, error: alunosError } = await this.client
      .from(ALUNOS_TABLE)
      .select("id, nome_completo, email")
      .in("id", alunoIds)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (alunosError) {
      throw new Error(`Failed to get alunos details: ${alunosError.message}`);
    }

    return (alunos ?? []).map((a) => {
      const link = linksMap.get(a.id);
      return {
        id: a.id,
        nomeCompleto: a.nome_completo,
        email: a.email,
        status: link?.status ?? null,
        dataEntrada: link?.data_entrada ?? null,
      };
    });
  }

  async vincularAluno(turmaId: string, alunoId: string, dataEntrada?: string): Promise<void> {
    const { error } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .insert({
        usuario_id: alunoId,
        turma_id: turmaId,
        status: "ativo",
        data_entrada: dataEntrada ?? new Date().toISOString().split("T")[0],
      });

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === "23505") {
        throw new Error("Aluno já está vinculado a esta turma");
      }
      throw new Error(`Failed to vincular aluno: ${error.message}`);
    }
  }

  async desvincularAluno(turmaId: string, alunoId: string, status?: AlunoTurmaStatus): Promise<void> {
    const { error } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .update({
        status: status ?? "cancelado",
        data_saida: new Date().toISOString().split("T")[0],
      })
      .eq("turma_id", turmaId)
      .eq("usuario_id", alunoId)
      .eq("status", "ativo");

    if (error) {
      throw new Error(`Failed to desvincular aluno: ${error.message}`);
    }
  }

  async countAlunosByTurma(turmaIds: string[]): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .select("turma_id")
      .in("turma_id", turmaIds)
      .eq("status", "ativo");

    if (error) {
      throw new Error(`Failed to count alunos: ${error.message}`);
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.turma_id] = (counts[row.turma_id] ?? 0) + 1;
    }

    return counts;
  }

  async getCursoEmpresaId(cursoId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from(CURSOS_TABLE)
      .select("empresa_id")
      .eq("id", cursoId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.empresa_id;
  }
}
