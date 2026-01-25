import { SupabaseClient } from "@supabase/supabase-js";
import {
  RegraAtividade,
  CreateRegraAtividadeInput,
  UpdateRegraAtividadeInput,
} from "./regras.types";

export interface RegraAtividadeRepository {
  listByCurso(cursoId: string): Promise<RegraAtividade[]>;
  findById(id: string): Promise<RegraAtividade | null>;
  create(input: CreateRegraAtividadeInput): Promise<RegraAtividade>;
  update(
    id: string,
    payload: UpdateRegraAtividadeInput,
  ): Promise<RegraAtividade>;
  delete(id: string): Promise<void>;
}

const TABLE = "regras_atividades";

type RegraAtividadeRow = {
  id: string;
  curso_id: string | null;
  tipo_atividade: RegraAtividade["tipoAtividade"];
  nome_padrao: string;
  frequencia_modulos: number;
  comecar_no_modulo: number;
  acumulativo: boolean;
  acumulativo_desde_inicio: boolean;
  gerar_no_ultimo: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: RegraAtividadeRow): RegraAtividade {
  return {
    id: row.id,
    cursoId: row.curso_id,
    tipoAtividade: row.tipo_atividade,
    nomePadrao: row.nome_padrao,
    frequenciaModulos: row.frequencia_modulos,
    comecarNoModulo: row.comecar_no_modulo,
    acumulativo: row.acumulativo,
    acumulativoDesdeInicio: row.acumulativo_desde_inicio ?? false,
    gerarNoUltimo: row.gerar_no_ultimo,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message;
  return (
    code === "PGRST116" ||
    code === "42P01" ||
    (typeof message === "string" && message.includes("regras_atividades"))
  );
}

export class RegraAtividadeRepositoryImpl implements RegraAtividadeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByCurso(cursoId: string): Promise<RegraAtividade[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("curso_id", cursoId)
      .order("created_at", { ascending: true });

    if (error) {
      if (isMissingTable(error)) {
        // Ambiente sem migração aplicada: retorna vazio para não quebrar a UI
        return [];
      }
      throw new Error(`Failed to list rules: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<RegraAtividade | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch rule: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(input: CreateRegraAtividadeInput): Promise<RegraAtividade> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        curso_id: input.cursoId,
        tipo_atividade: input.tipoAtividade,
        nome_padrao: input.nomePadrao,
        frequencia_modulos: input.frequenciaModulos ?? 1,
        comecar_no_modulo: input.comecarNoModulo ?? 1,
        acumulativo: input.acumulativo ?? false,
        acumulativo_desde_inicio: input.acumulativoDesdeInicio ?? false,
        gerar_no_ultimo: input.gerarNoUltimo ?? false,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTable(error)) {
        throw new Error(
          "Regras de atividade não estão habilitadas. Aplique a migração para criar a tabela regras_atividades.",
        );
      }
      throw new Error(`Failed to create rule: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(
    id: string,
    payload: UpdateRegraAtividadeInput,
  ): Promise<RegraAtividade> {
    const { data, error } = await this.client
      .from(TABLE)
      .update({
        tipo_atividade: payload.tipoAtividade,
        nome_padrao: payload.nomePadrao,
        frequencia_modulos: payload.frequenciaModulos,
        comecar_no_modulo: payload.comecarNoModulo,
        acumulativo: payload.acumulativo,
        acumulativo_desde_inicio: payload.acumulativoDesdeInicio,
        gerar_no_ultimo: payload.gerarNoUltimo,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isMissingTable(error)) {
        throw new Error(
          "Regras de atividade não estão habilitadas. Aplique a migração para criar a tabela regras_atividades.",
        );
      }
      throw new Error(`Failed to update rule: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete rule: ${error.message}`);
    }
  }
}

export { mapRow as mapRegraAtividadeRow };
