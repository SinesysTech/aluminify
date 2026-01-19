import { SupabaseClient } from "@supabase/supabase-js";
import {
  Atividade,
  CreateAtividadeInput,
  UpdateAtividadeInput,
  TipoAtividade,
  AtividadeComProgressoEHierarquia,
} from "./atividade.types";

export interface AtividadeRepository {
  listByModulo(moduloId: string): Promise<Atividade[]>;
  listByFrente(frenteId: string): Promise<Atividade[]>;
  findById(id: string): Promise<Atividade | null>;
  create(input: CreateAtividadeInput): Promise<Atividade>;
  update(id: string, payload: UpdateAtividadeInput): Promise<Atividade>;
  delete(id: string): Promise<void>;
  listByAlunoMatriculas(
    alunoId: string,
  ): Promise<AtividadeComProgressoEHierarquia[]>;
}

const TABLE = "atividades";
const MODULO_TABLE = "modulos";

type AtividadeRow = {
  id: string;
  modulo_id: string;
  tipo: TipoAtividade;
  titulo: string;
  arquivo_url: string | null;
  gabarito_url: string | null;
  link_externo: string | null;
  obrigatorio: boolean;
  ordem_exibicao: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRow(row: AtividadeRow): Atividade {
  return {
    id: row.id,
    titulo: row.titulo,
    nome: row.titulo, // Map titulo to nome for compatibility
    moduloId: row.modulo_id,
    modulo_id: row.modulo_id,
    tipo: row.tipo,
    arquivoUrl: row.arquivo_url,
    arquivo_url: row.arquivo_url,
    gabaritoUrl: row.gabarito_url,
    gabarito_url: row.gabarito_url,
    linkExterno: row.link_externo,
    link_externo: row.link_externo,
    obrigatorio: row.obrigatorio ?? true,
    ordemExibicao: row.ordem_exibicao ?? 0,
    ordem_exibicao: row.ordem_exibicao,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    created_at: row.created_at,
    updatedAt: new Date(row.updated_at),
    updated_at: row.updated_at,
  };
}

export type { AtividadeRow };

export class AtividadeRepositoryImpl implements AtividadeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByModulo(moduloId: string): Promise<Atividade[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("modulo_id", moduloId)
      .order("ordem_exibicao", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list activities by module: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listByFrente(frenteId: string): Promise<Atividade[]> {
    // Primeiro buscar todos os módulos da frente
    const { data: modulos, error: modulosError } = await this.client
      .from(MODULO_TABLE)
      .select("id")
      .eq("frente_id", frenteId);

    if (modulosError) {
      throw new Error(
        `Failed to fetch modules by frente: ${modulosError.message}`,
      );
    }

    if (!modulos || modulos.length === 0) {
      return [];
    }

    const moduloIds = modulos.map((m) => m.id);

    // Depois buscar todas as atividades desses módulos
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .in("modulo_id", moduloIds)
      .order("ordem_exibicao", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list activities by frente: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<Atividade | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch activity: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(input: CreateAtividadeInput): Promise<Atividade> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        modulo_id: input.moduloId,
        tipo: input.tipo,
        titulo: input.titulo,
        arquivo_url: input.arquivoUrl ?? null,
        gabarito_url: input.gabaritoUrl ?? null,
        link_externo: input.linkExterno ?? null,
        obrigatorio: input.obrigatorio ?? true,
        ordem_exibicao: input.ordemExibicao ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create activity: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateAtividadeInput): Promise<Atividade> {
    const updateData: Record<string, unknown> = {};

    if (payload.arquivoUrl !== undefined) {
      updateData.arquivo_url = payload.arquivoUrl;
    }

    if (payload.gabaritoUrl !== undefined) {
      updateData.gabarito_url = payload.gabaritoUrl;
    }

    if (payload.linkExterno !== undefined) {
      updateData.link_externo = payload.linkExterno;
    }

    if (payload.titulo !== undefined) {
      updateData.titulo = payload.titulo;
    }

    if (payload.obrigatorio !== undefined) {
      updateData.obrigatorio = payload.obrigatorio;
    }

    if (payload.ordemExibicao !== undefined) {
      updateData.ordem_exibicao = payload.ordemExibicao;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update activity: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete activity: ${error.message}`);
    }
  }

  async listByAlunoMatriculas(
    alunoId: string,
  ): Promise<AtividadeComProgressoEHierarquia[]> {
    // Importar helper dinamicamente para evitar dependência circular
    const { listByAlunoMatriculasHelper } =
      await import("./atividade.repository-helper");
    return listByAlunoMatriculasHelper(this.client, alunoId);
  }
}
