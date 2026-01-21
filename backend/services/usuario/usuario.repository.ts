/**
 * Usuario Repository
 *
 * Provides data access methods for the usuarios table with full type safety.
 * Handles CRUD operations for institution staff (professors, admins, staff, monitors).
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  Usuario,
  UsuarioWithPapel,
  UsuarioSummary,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioDisciplina,
  CreateUsuarioDisciplinaInput,
  UsuarioWithDisciplinas,
  DisciplinaBasic,
} from "@/types/shared/entities/usuario";
import type {
  Papel,
  RolePermissions,
  RoleTipo,
} from "@/types/shared/entities/papel";

const TABLE = "usuarios";
const DISCIPLINAS_TABLE = "usuarios_disciplinas";

type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type UsuarioInsert = Database["public"]["Tables"]["usuarios"]["Insert"];
type UsuarioUpdate = Database["public"]["Tables"]["usuarios"]["Update"];
type UsuarioDisciplinaRow =
  Database["public"]["Tables"]["usuarios_disciplinas"]["Row"];
type UsuarioDisciplinaInsert =
  Database["public"]["Tables"]["usuarios_disciplinas"]["Insert"];
type PapelRow = Database["public"]["Tables"]["papeis"]["Row"];

function mapRow(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    papelId: row.papel_id,
    nomeCompleto: row.nome_completo,
    email: row.email,
    cpf: row.cpf,
    telefone: row.telefone,
    chavePix: row.chave_pix,
    fotoUrl: row.foto_url,
    biografia: row.biografia,
    especialidade: row.especialidade,
    ativo: row.ativo,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

function mapPapelRow(row: PapelRow): Papel {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nome: row.nome,
    tipo: row.tipo as RoleTipo,
    descricao: row.descricao,
    permissoes: row.permissoes as unknown as RolePermissions,
    isSystem: row.is_system,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRowWithPapel(
  row: UsuarioRow & { papeis: PapelRow },
): UsuarioWithPapel {
  const usuario = mapRow(row);
  const papel = mapPapelRow(row.papeis);
  return {
    ...usuario,
    papel,
    permissoes: papel.permissoes,
  };
}

function mapUsuarioDisciplinaRow(row: UsuarioDisciplinaRow): UsuarioDisciplina {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    disciplinaId: row.disciplina_id,
    empresaId: row.empresa_id,
    cursoId: row.curso_id,
    turmaId: row.turma_id,
    frenteId: row.frente_id,
    moduloId: row.modulo_id,
    ativo: row.ativo,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface UsuarioRepository {
  // Basic CRUD
  findById(id: string): Promise<Usuario | null>;
  findByIdWithPapel(id: string): Promise<UsuarioWithPapel | null>;
  findByEmail(email: string, empresaId: string): Promise<Usuario | null>;
  listByEmpresa(
    empresaId: string,
    includeInactive?: boolean,
  ): Promise<Usuario[]>;
  listByEmpresaWithPapel(
    empresaId: string,
    includeInactive?: boolean,
  ): Promise<UsuarioWithPapel[]>;
  listSummaryByEmpresa(
    empresaId: string,
    includeInactive?: boolean,
  ): Promise<UsuarioSummary[]>;
  listByPapelTipo(empresaId: string, tipo: RoleTipo): Promise<Usuario[]>;
  create(payload: CreateUsuarioInput): Promise<Usuario>;
  update(id: string, payload: UpdateUsuarioInput): Promise<Usuario>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;

  // Disciplina associations
  findWithDisciplinas(id: string): Promise<UsuarioWithDisciplinas | null>;
  listDisciplinas(usuarioId: string): Promise<DisciplinaBasic[]>;
  addDisciplina(
    payload: CreateUsuarioDisciplinaInput,
  ): Promise<UsuarioDisciplina>;
  removeDisciplina(usuarioId: string, disciplinaId: string): Promise<void>;
  setDisciplinas(
    usuarioId: string,
    disciplinaIds: string[],
    empresaId: string,
  ): Promise<void>;
  listByDisciplina(disciplinaId: string): Promise<Usuario[]>;
}

export class UsuarioRepositoryImpl implements UsuarioRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch usuario: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByIdWithPapel(id: string): Promise<UsuarioWithPapel | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*, papeis!inner(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch usuario with papel: ${error.message}`);
    }

    return data
      ? mapRowWithPapel(data as UsuarioRow & { papeis: PapelRow })
      : null;
  }

  async findByEmail(email: string, empresaId: string): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("email", email)
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch usuario by email: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async listByEmpresa(
    empresaId: string,
    includeInactive = false,
  ): Promise<Usuario[]> {
    let query = this.client
      .from(TABLE)
      .select("*")
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (!includeInactive) {
      query = query.eq("ativo", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list usuarios by empresa: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listByEmpresaWithPapel(
    empresaId: string,
    includeInactive = false,
  ): Promise<UsuarioWithPapel[]> {
    let query = this.client
      .from(TABLE)
      .select("*, papeis!inner(*)")
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (!includeInactive) {
      query = query.eq("ativo", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list usuarios with papel: ${error.message}`);
    }

    return (data ?? []).map((row) =>
      mapRowWithPapel(row as UsuarioRow & { papeis: PapelRow }),
    );
  }

  async listSummaryByEmpresa(
    empresaId: string,
    includeInactive = false,
  ): Promise<UsuarioSummary[]> {
    let query = this.client
      .from(TABLE)
      .select(
        "id, nome_completo, email, foto_url, ativo, papeis!inner(nome, tipo)",
      )
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (!includeInactive) {
      query = query.eq("ativo", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list usuario summaries: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      nomeCompleto: row.nome_completo,
      email: row.email,
      fotoUrl: row.foto_url,
      papelNome: (row.papeis as { nome: string; tipo: string }).nome,
      papelTipo: (row.papeis as { nome: string; tipo: string })
        .tipo as RoleTipo,
      ativo: row.ativo,
    }));
  }

  async listByPapelTipo(empresaId: string, tipo: RoleTipo): Promise<Usuario[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*, papeis!inner(*)")
      .eq("empresa_id", empresaId)
      .eq("papeis.tipo", tipo)
      .eq("ativo", true)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to list usuarios by papel tipo: ${error.message}`,
      );
    }

    return (data ?? []).map(mapRow);
  }

  async create(payload: CreateUsuarioInput): Promise<Usuario> {
    const insertData: UsuarioInsert = {
      id: payload.id,
      empresa_id: payload.empresaId,
      papel_id: payload.papelId,
      nome_completo: payload.nomeCompleto,
      email: payload.email,
      cpf: payload.cpf ?? null,
      telefone: payload.telefone ?? null,
      chave_pix: payload.chavePix ?? null,
      foto_url: payload.fotoUrl ?? null,
      biografia: payload.biografia ?? null,
      especialidade: payload.especialidade ?? null,
      ativo: true,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create usuario: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateUsuarioInput): Promise<Usuario> {
    const updateData: UsuarioUpdate = {};

    if (payload.papelId !== undefined) {
      updateData.papel_id = payload.papelId;
    }
    if (payload.nomeCompleto !== undefined) {
      updateData.nome_completo = payload.nomeCompleto;
    }
    if (payload.email !== undefined) {
      updateData.email = payload.email;
    }
    if (payload.cpf !== undefined) {
      updateData.cpf = payload.cpf;
    }
    if (payload.telefone !== undefined) {
      updateData.telefone = payload.telefone;
    }
    if (payload.chavePix !== undefined) {
      updateData.chave_pix = payload.chavePix;
    }
    if (payload.fotoUrl !== undefined) {
      updateData.foto_url = payload.fotoUrl;
    }
    if (payload.biografia !== undefined) {
      updateData.biografia = payload.biografia;
    }
    if (payload.especialidade !== undefined) {
      updateData.especialidade = payload.especialidade;
    }
    if (payload.ativo !== undefined) {
      updateData.ativo = payload.ativo;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update usuario: ${error.message}`);
    }

    return mapRow(data);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString(), ativo: false })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to soft delete usuario: ${error.message}`);
    }
  }

  async restore(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ deleted_at: null, ativo: true })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to restore usuario: ${error.message}`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to hard delete usuario: ${error.message}`);
    }
  }

  // Disciplina associations

  async findWithDisciplinas(
    id: string,
  ): Promise<UsuarioWithDisciplinas | null> {
    const usuario = await this.findById(id);
    if (!usuario) {
      return null;
    }

    const disciplinas = await this.listDisciplinas(id);

    return {
      ...usuario,
      disciplinas,
    };
  }

  async listDisciplinas(usuarioId: string): Promise<DisciplinaBasic[]> {
    const { data, error } = await this.client
      .from(DISCIPLINAS_TABLE)
      .select("disciplina_id, disciplinas!inner(id, nome)")
      .eq("usuario_id", usuarioId)
      .eq("ativo", true);

    if (error) {
      throw new Error(`Failed to list usuario disciplinas: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: (row.disciplinas as { id: string; nome: string }).id,
      nome: (row.disciplinas as { id: string; nome: string }).nome,
    }));
  }

  async addDisciplina(
    payload: CreateUsuarioDisciplinaInput,
  ): Promise<UsuarioDisciplina> {
    const insertData: UsuarioDisciplinaInsert = {
      usuario_id: payload.usuarioId,
      disciplina_id: payload.disciplinaId,
      empresa_id: payload.empresaId,
      curso_id: payload.cursoId ?? null,
      turma_id: payload.turmaId ?? null,
      frente_id: payload.frenteId ?? null,
      modulo_id: payload.moduloId ?? null,
      ativo: true,
    };

    const { data, error } = await this.client
      .from(DISCIPLINAS_TABLE)
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to add disciplina to usuario: ${error.message}`);
    }

    return mapUsuarioDisciplinaRow(data);
  }

  async removeDisciplina(
    usuarioId: string,
    disciplinaId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from(DISCIPLINAS_TABLE)
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("disciplina_id", disciplinaId);

    if (error) {
      throw new Error(
        `Failed to remove disciplina from usuario: ${error.message}`,
      );
    }
  }

  async setDisciplinas(
    usuarioId: string,
    disciplinaIds: string[],
    empresaId: string,
  ): Promise<void> {
    // Remove all existing disciplina associations
    const { error: deleteError } = await this.client
      .from(DISCIPLINAS_TABLE)
      .delete()
      .eq("usuario_id", usuarioId);

    if (deleteError) {
      throw new Error(
        `Failed to clear usuario disciplinas: ${deleteError.message}`,
      );
    }

    // Add new associations
    if (disciplinaIds.length > 0) {
      const insertData: UsuarioDisciplinaInsert[] = disciplinaIds.map(
        (disciplinaId) => ({
          usuario_id: usuarioId,
          disciplina_id: disciplinaId,
          empresa_id: empresaId,
          ativo: true,
        }),
      );

      const { error: insertError } = await this.client
        .from(DISCIPLINAS_TABLE)
        .insert(insertData);

      if (insertError) {
        throw new Error(
          `Failed to set usuario disciplinas: ${insertError.message}`,
        );
      }
    }
  }

  async listByDisciplina(disciplinaId: string): Promise<Usuario[]> {
    const { data, error } = await this.client
      .from(DISCIPLINAS_TABLE)
      .select("usuarios!inner(*)")
      .eq("disciplina_id", disciplinaId)
      .eq("ativo", true);

    if (error) {
      throw new Error(
        `Failed to list usuarios by disciplina: ${error.message}`,
      );
    }

    return (data ?? []).map((row) =>
      mapRow(row.usuarios as unknown as UsuarioRow),
    );
  }
}
