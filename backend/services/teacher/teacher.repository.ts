import { SupabaseClient } from '@supabase/supabase-js';
import { Teacher, CreateTeacherInput, UpdateTeacherInput } from './teacher.types';

export interface TeacherRepository {
  list(): Promise<Teacher[]>;
  findById(id: string): Promise<Teacher | null>;
  findByEmail(email: string): Promise<Teacher | null>;
  findByCpf(cpf: string): Promise<Teacher | null>;
  create(payload: CreateTeacherInput): Promise<Teacher>;
  update(id: string, payload: UpdateTeacherInput): Promise<Teacher>;
  delete(id: string): Promise<void>;
}

const TABLE = 'professores';

type TeacherRow = {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  biografia: string | null;
  foto_url: string | null;
  especialidade: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: TeacherRow): Teacher {
  return {
    id: row.id,
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
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Teacher[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) {
      throw new Error(`Failed to list teachers: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
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
    const insertData: Record<string, unknown> = {
      nome_completo: payload.fullName,
      email: payload.email.toLowerCase(),
      cpf: payload.cpf ?? null,
      telefone: payload.phone ?? null,
      biografia: payload.biography ?? null,
      foto_url: payload.photoUrl ?? null,
      especialidade: payload.specialty ?? null,
    };

    if (payload.id) {
      insertData.id = payload.id;
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
    const updateData: Record<string, unknown> = {};

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
}

