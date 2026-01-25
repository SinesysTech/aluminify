import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  ProgressoAtividade,
  CreateProgressoInput,
  UpdateProgressoInput,
  StatusAtividade,
  DificuldadePercebida,
} from "./progresso.types";

export interface ProgressoAtividadeRepository {
  findById(id: string): Promise<ProgressoAtividade | null>;
  findByAlunoAndAtividade(
    alunoId: string,
    atividadeId: string,
  ): Promise<ProgressoAtividade | null>;
  listByAluno(alunoId: string): Promise<ProgressoAtividade[]>;
  create(payload: CreateProgressoInput): Promise<ProgressoAtividade>;
  update(
    id: string,
    payload: UpdateProgressoInput,
  ): Promise<ProgressoAtividade>;
  findOrCreateProgresso(
    alunoId: string,
    atividadeId: string,
    status?: StatusAtividade,
  ): Promise<ProgressoAtividade>;
}

const TABLE = "progresso_atividades";

// Use generated Database types instead of manual definitions
type ProgressoRow = Database["public"]["Tables"]["progresso_atividades"]["Row"];
type _ProgressoInsert =
  Database["public"]["Tables"]["progresso_atividades"]["Insert"];
type ProgressoUpdate =
  Database["public"]["Tables"]["progresso_atividades"]["Update"];

function mapRow(row: ProgressoRow): ProgressoAtividade {
  return {
    id: row.id,
    alunoId: row.aluno_id ?? "",
    atividadeId: row.atividade_id ?? "",
    status: (row.status as StatusAtividade) ?? "Pendente",
    dataInicio: row.data_inicio ? new Date(row.data_inicio) : null,
    dataConclusao: row.data_conclusao ? new Date(row.data_conclusao) : null,
    questoesTotais: row.questoes_totais ?? 0,
    questoesAcertos: row.questoes_acertos ?? 0,
    dificuldadePercebida:
      (row.dificuldade_percebida as DificuldadePercebida) ?? null,
    anotacoesPessoais: row.anotacoes_pessoais ?? null,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

export class ProgressoAtividadeRepositoryImpl implements ProgressoAtividadeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<ProgressoAtividade | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find progresso by id: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByAlunoAndAtividade(
    alunoId: string,
    atividadeId: string,
  ): Promise<ProgressoAtividade | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("aluno_id", alunoId)
      .eq("atividade_id", atividadeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find progresso: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async listByAluno(alunoId: string): Promise<ProgressoAtividade[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list progresso by aluno: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(payload: CreateProgressoInput): Promise<ProgressoAtividade> {
    const insertData = {
      aluno_id: payload.alunoId,
      atividade_id: payload.atividadeId,
      status: payload.status ?? "Pendente",
      data_inicio: payload.dataInicio?.toISOString() ?? null,
      data_conclusao: payload.dataConclusao?.toISOString() ?? null,
      questoes_totais: payload.questoesTotais ?? 0,
      questoes_acertos: payload.questoesAcertos ?? 0,
      dificuldade_percebida: payload.dificuldadePercebida ?? null,
      anotacoes_pessoais: payload.anotacoesPessoais ?? null,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create progresso: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(
    id: string,
    payload: UpdateProgressoInput,
  ): Promise<ProgressoAtividade> {
    const updateData: ProgressoUpdate = {};

    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }
    if (payload.dataInicio !== undefined) {
      updateData.data_inicio = payload.dataInicio?.toISOString() ?? null;
    }
    if (payload.dataConclusao !== undefined) {
      updateData.data_conclusao = payload.dataConclusao?.toISOString() ?? null;
    }
    if (payload.questoesTotais !== undefined) {
      updateData.questoes_totais = payload.questoesTotais;
    }
    if (payload.questoesAcertos !== undefined) {
      updateData.questoes_acertos = payload.questoesAcertos;
    }
    if (payload.dificuldadePercebida !== undefined) {
      updateData.dificuldade_percebida = payload.dificuldadePercebida;
    }
    if (payload.anotacoesPessoais !== undefined) {
      updateData.anotacoes_pessoais = payload.anotacoesPessoais;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update progresso: ${error.message}`);
    }

    return mapRow(data);
  }

  async findOrCreateProgresso(
    alunoId: string,
    atividadeId: string,
    status: StatusAtividade = "Pendente",
  ): Promise<ProgressoAtividade> {
    // Primeiro tentar encontrar
    const existing = await this.findByAlunoAndAtividade(alunoId, atividadeId);
    if (existing) {
      return existing;
    }

    // Se não existir, criar
    return this.create({
      alunoId,
      atividadeId,
      status,
    });
  }
}
