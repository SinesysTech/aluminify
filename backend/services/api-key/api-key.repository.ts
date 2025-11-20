import { SupabaseClient } from '@supabase/supabase-js';
import { ApiKey, CreateApiKeyInput, UpdateApiKeyInput } from './api-key.types';

export interface ApiKeyRepository {
  list(): Promise<ApiKey[]>;
  findById(id: string): Promise<ApiKey | null>;
  findByCreatedBy(createdBy: string): Promise<ApiKey[]>;
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  create(payload: CreateApiKeyInput & { key: string; createdBy: string; active: boolean }): Promise<ApiKey>;
  update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey>;
  updateLastUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

const TABLE = 'api_keys';

type ApiKeyRow = {
  id: string;
  name: string;
  key: string;
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    name: row.name,
    key: row.key, // Este será o hash, não a chave original
    createdBy: row.created_by,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    active: row.active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ApiKeyRepositoryImpl implements ApiKeyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list API keys: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<ApiKey | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch API key: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByCreatedBy(createdBy: string): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys by creator: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('key', keyHash)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch API key by hash: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateApiKeyInput & { key: string; createdBy: string; active: boolean }): Promise<ApiKey> {
    const insertData: Record<string, unknown> = {
      name: payload.name,
      key: payload.key,
      created_by: payload.createdBy,
      expires_at: payload.expiresAt ?? null,
      active: payload.active,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey> {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name;
    }

    if (payload.active !== undefined) {
      updateData.active = payload.active;
    }

    if (payload.expiresAt !== undefined) {
      updateData.expires_at = payload.expiresAt;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    return mapRow(data);
  }

  async updateLastUsed(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update last used: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  }
}

