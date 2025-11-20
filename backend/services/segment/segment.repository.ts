import { SupabaseClient } from '@supabase/supabase-js';
import { Segment, CreateSegmentInput, UpdateSegmentInput } from './segment.types';

export interface SegmentRepository {
  list(): Promise<Segment[]>;
  findById(id: string): Promise<Segment | null>;
  findByName(name: string): Promise<Segment | null>;
  findBySlug(slug: string): Promise<Segment | null>;
  create(payload: CreateSegmentInput): Promise<Segment>;
  update(id: string, payload: UpdateSegmentInput): Promise<Segment>;
  delete(id: string): Promise<void>;
}

const TABLE = 'segmentos';

type SegmentRow = {
  id: string;
  nome: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SegmentRow): Segment {
  return {
    id: row.id,
    name: row.nome,
    slug: row.slug,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SegmentRepositoryImpl implements SegmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Segment[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Failed to list segments: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<Segment | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch segment: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByName(name: string): Promise<Segment | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('nome', name).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch segment by name: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findBySlug(slug: string): Promise<Segment | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('slug', slug).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch segment by slug: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateSegmentInput): Promise<Segment> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({ nome: payload.name, slug: payload.slug ?? null })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create segment: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateSegmentInput): Promise<Segment> {
    const updateData: { nome?: string; slug?: string | null } = {};
    
    if (payload.name !== undefined) {
      updateData.nome = payload.name;
    }
    
    if (payload.slug !== undefined) {
      updateData.slug = payload.slug;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update segment: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete segment: ${error.message}`);
    }
  }
}

