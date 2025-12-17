import { SupabaseClient } from '@supabase/supabase-js';
import { Segment, CreateSegmentInput, UpdateSegmentInput } from './segment.types';
import type { PaginationParams, PaginationMeta } from '@/types/shared/dtos/api-responses';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SegmentRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Segment>>;
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

  async list(params?: PaginationParams): Promise<PaginatedResult<Segment>> {
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
      throw new Error(`Failed to count segments: ${countError.message}`);
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
      throw new Error(`Failed to list segments: ${error.message}`);
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

