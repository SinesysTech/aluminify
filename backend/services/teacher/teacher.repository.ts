import { SupabaseClient } from '@supabase/supabase-js';
import { Teacher, CreateTeacherInput, UpdateTeacherInput } from './teacher.types';
import type { PaginationParams, PaginationMeta } from '@/types/shared/dtos/api-responses';
import type { Database } from '@/lib/database.types';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface TeacherRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Teacher>>;
  findById(id: string): Promise<Teacher | null>;
  findByEmail(email: string): Promise<Teacher | null>;
  findByCpf(cpf: string): Promise<Teacher | null>;
  create(payload: CreateTeacherInput): Promise<Teacher>;
  update(id: string, payload: UpdateTeacherInput): Promise<Teacher>;
  delete(id: string): Promise<void>;
  findByEmpresa(empresaId: string): Promise<Teacher[]>;
  setAsAdmin(teacherId: string, isAdmin: boolean): Promise<void>;
}

const TABLE = 'professores';

// Use generated Database types instead of manual type definition
type TeacherRow = Database['public']['Tables']['professores']['Row'];
type TeacherInsert = Database['public']['Tables']['professores']['Insert'];
type TeacherUpdate = Database['public']['Tables']['professores']['Update'];

function mapRow(row: TeacherRow): Teacher {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    isAdmin: row.is_admin,
    fullName: row.nome_completo,
    email: row.email,
    cpf: row.cpf,
    phone: row.telefone,
    biography: row.biografia,
    photoUrl: row.foto_url,
    specialty: row.especialidade,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class TeacherRepositoryImpl implements TeacherRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Teacher>> {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 50;
    const sortBy = params?.sortBy ?? 'nome_completo';
    const sortOrder = params?.sortOrder === 'desc' ? false : true;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Get total count
    const { count, error: countError } = await this.client
      .from(TABLE)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count teachers: ${countError.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Get paginated data
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order(sortBy, { ascending: sortOrder })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to list teachers: ${error.message}`);
    }

    return {
      data: (data ?? []).map(mapRow),
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<Teacher | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch teacher: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByEmail(email: string): Promise<Teacher | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch teacher by email: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByCpf(cpf: string): Promise<Teacher | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('cpf', cpf).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch teacher by CPF: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateTeacherInput): Promise<Teacher> {
    const insertData: TeacherInsert = {
      id: payload.id, // ID is required (comes from auth.users)
      nome_completo: payload.fullName,
      email: payload.email.toLowerCase(),
      empresa_id: payload.empresaId,
      is_admin: payload.isAdmin ?? false,
      cpf: payload.cpf ?? null,
      telefone: payload.phone ?? null,
      biografia: payload.biography ?? null,
      foto_url: payload.photoUrl ?? null,
      especialidade: payload.specialty ?? null,
    };

    // Validate ID is provided
    if (!insertData.id) {
      throw new Error('Teacher ID is required. User must be created in auth.users first.');
    }

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create teacher: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateTeacherInput): Promise<Teacher> {
    const updateData: TeacherUpdate = {};

    if (payload.fullName !== undefined) {
      updateData.nome_completo = payload.fullName;
    }

    if (payload.email !== undefined) {
      updateData.email = payload.email.toLowerCase();
    }

    if (payload.cpf !== undefined) {
      updateData.cpf = payload.cpf;
    }

    if (payload.phone !== undefined) {
      updateData.telefone = payload.phone;
    }

    if (payload.biography !== undefined) {
      updateData.biografia = payload.biography;
    }

    if (payload.photoUrl !== undefined) {
      updateData.foto_url = payload.photoUrl;
    }

    if (payload.specialty !== undefined) {
      updateData.especialidade = payload.specialty;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update teacher: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete teacher: ${error.message}`);
    }
  }

  async findByEmpresa(empresaId: string): Promise<Teacher[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome_completo', { ascending: true });

    if (error) {
      throw new Error(`Failed to list teachers by empresa: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async setAsAdmin(teacherId: string, isAdmin: boolean): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ is_admin: isAdmin })
      .eq('id', teacherId);

    if (error) {
      throw new Error(`Failed to update teacher admin status: ${error.message}`);
    }
  }
}

