import { SupabaseClient } from '@supabase/supabase-js';
import { Discipline, CreateDisciplineInput, UpdateDisciplineInput } from './discipline.types';

export interface DisciplineRepository {
  list(): Promise<Discipline[]>;
  findById(id: string): Promise<Discipline | null>;
  findByName(name: string): Promise<Discipline | null>;
  create(payload: CreateDisciplineInput): Promise<Discipline>;
  update(id: string, payload: UpdateDisciplineInput): Promise<Discipline>;
  delete(id: string): Promise<void>;
}

const TABLE = 'disciplinas';

type DisciplineRow = {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
};

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

  async list(): Promise<Discipline[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Failed to list disciplines: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
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
    const { data, error } = await this.client
      .from(TABLE)
      .insert({ nome: payload.name })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create discipline: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateDisciplineInput): Promise<Discipline> {
    const { data, error } = await this.client
      .from(TABLE)
      .update({ nome: payload.name })
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
