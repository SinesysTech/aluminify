import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Discipline, CreateDisciplineInput, UpdateDisciplineInput } from './discipline.types';
import type { PaginationParams, PaginationMeta } from '@/types/shared/dtos/api-responses';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DisciplineRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Discipline>>;
  findById(id: string): Promise<Discipline | null>;
  findByName(name: string): Promise<Discipline | null>;
  create(payload: CreateDisciplineInput): Promise<Discipline>;
  update(id: string, payload: UpdateDisciplineInput): Promise<Discipline>;
  delete(id: string): Promise<void>;
}

const TABLE = 'disciplinas';

// Use generated Database types instead of manual definitions
type DisciplineRow = Database['public']['Tables']['disciplinas']['Row'];
type DisciplineInsert = Database['public']['Tables']['disciplinas']['Insert'];
type DisciplineUpdate = Database['public']['Tables']['disciplinas']['Update'];

function mapRow(row: DisciplineRow): Discipline {
  return {
    id: row.id,
    name: row.nome,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class DisciplineRepositoryImpl implements DisciplineRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Discipline>> {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 50;
    const sortBy = params?.sortBy ?? 'nome';
    const sortOrder = params?.sortOrder === 'desc' ? false : true;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Get total count
    const { count, error: countError } = await this.client
      .from(TABLE)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count disciplines: ${countError.message}`);
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
      throw new Error(`Failed to list disciplines: ${error.message}`);
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

  async findById(id: string): Promise<Discipline | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch discipline: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByName(name: string): Promise<Discipline | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('nome', name).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch discipline by name: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateDisciplineInput): Promise<Discipline> {
    const insertData: DisciplineInsert = {
      nome: payload.name,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create discipline: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateDisciplineInput): Promise<Discipline> {
    const updateData: DisciplineUpdate = {
      nome: payload.name,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update discipline: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete discipline: ${error.message}`);
    }
  }
}
