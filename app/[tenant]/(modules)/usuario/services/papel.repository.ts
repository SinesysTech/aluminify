/**
 * Papel Repository
 *
 * Provides data access methods for the papeis table with full type safety.
 * Handles CRUD operations for roles (papéis) in the RBAC system.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type {
  Papel,
  CreatePapelInput,
  UpdatePapelInput,
  RolePermissions,
  RoleTipo,
} from "@/app/shared/types/entities/papel";

const TABLE = "papeis";

type PapelRow = Database["public"]["Tables"]["papeis"]["Row"];
type PapelInsert = Database["public"]["Tables"]["papeis"]["Insert"];
type PapelUpdate = Database["public"]["Tables"]["papeis"]["Update"];

function mapRow(row: PapelRow): Papel {
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

export interface PapelRepository {
  findById(id: string): Promise<Papel | null>;
  findByTipo(tipo: RoleTipo, empresaId?: string): Promise<Papel | null>;
  findSystemByTipo(tipo: RoleTipo): Promise<Papel | null>;
  listByEmpresa(empresaId: string): Promise<Papel[]>;
  listSystemRoles(): Promise<Papel[]>;
  listAvailableForEmpresa(empresaId: string): Promise<Papel[]>;
  create(payload: CreatePapelInput): Promise<Papel>;
  update(id: string, payload: UpdatePapelInput): Promise<Papel>;
  delete(id: string): Promise<void>;
}

export class PapelRepositoryImpl implements PapelRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Papel | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch papel: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByTipo(tipo: RoleTipo, empresaId?: string): Promise<Papel | null> {
    let query = this.client.from(TABLE).select("*").eq("tipo", tipo);

    if (empresaId) {
      query = query.eq("empresa_id", empresaId);
    } else {
      query = query.is("empresa_id", null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch papel by tipo: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findSystemByTipo(tipo: RoleTipo): Promise<Papel | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("tipo", tipo)
      .eq("is_system", true)
      .is("empresa_id", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch system papel: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async listByEmpresa(empresaId: string): Promise<Papel[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to list papeis by empresa: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listSystemRoles(): Promise<Papel[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("is_system", true)
      .is("empresa_id", null)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to list system roles: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listAvailableForEmpresa(empresaId: string): Promise<Papel[]> {
    // Returns both system roles and empresa-specific custom roles
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
      .order("is_system", { ascending: false })
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to list available papeis: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(payload: CreatePapelInput): Promise<Papel> {
    const insertData: PapelInsert = {
      empresa_id: payload.empresaId,
      nome: payload.nome,
      // tipo is deprecated - use "staff" as default for backwards compatibility
      tipo: payload.tipo ?? "staff",
      descricao: payload.descricao ?? null,
      permissoes:
        payload.permissoes as unknown as Database["public"]["Tables"]["papeis"]["Insert"]["permissoes"],
      is_system: false, // Custom roles are never system roles
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create papel: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdatePapelInput): Promise<Papel> {
    // First check if it's a system role
    const existing = await this.findById(id);
    if (existing?.isSystem) {
      throw new Error("Cannot update system roles");
    }

    const updateData: PapelUpdate = {};

    if (payload.nome !== undefined) {
      updateData.nome = payload.nome;
    }

    if (payload.descricao !== undefined) {
      updateData.descricao = payload.descricao;
    }

    if (payload.permissoes !== undefined) {
      // Merge with existing permissions
      const currentPermissions = existing?.permissoes ?? {};
      updateData.permissoes = {
        ...currentPermissions,
        ...payload.permissoes,
      } as unknown as Database["public"]["Tables"]["papeis"]["Update"]["permissoes"];
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update papel: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    // First check if it's a system role
    const existing = await this.findById(id);
    if (existing?.isSystem) {
      throw new Error("Cannot delete system roles");
    }

    const { error } = await this.client.from(TABLE).delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete papel: ${error.message}`);
    }
  }
}
