import { randomBytes, createHash } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

// --- Types ---

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdBy: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  active?: boolean;
  expiresAt?: string | null;
}

// --- Errors ---

export class ApiKeyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyValidationError";
  }
}

export class ApiKeyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyNotFoundError";
  }
}

export class ApiKeyExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyExpiredError";
  }
}

export class ApiKeyInactiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyInactiveError";
  }
}

// --- Repository ---

const TABLE = "api_keys";

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
    key: row.key,
    createdBy: row.created_by,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    active: row.active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface ApiKeyRepository {
  list(): Promise<ApiKey[]>;
  findById(id: string): Promise<ApiKey | null>;
  findByCreatedBy(createdBy: string): Promise<ApiKey[]>;
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  create(
    payload: CreateApiKeyInput & {
      key: string;
      createdBy: string;
      active: boolean;
    },
  ): Promise<ApiKey>;
  update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey>;
  updateLastUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export class ApiKeyRepositoryImpl implements ApiKeyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to list API keys: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<ApiKey | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch API key: ${error.message}`);
    return data ? mapRow(data) : null;
  }

  async findByCreatedBy(createdBy: string): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("created_by", createdBy)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to fetch API keys by creator: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("key", keyHash)
      .maybeSingle();

    if (error)
      throw new Error(`Failed to fetch API key by hash: ${error.message}`);
    return data ? mapRow(data) : null;
  }

  async create(
    payload: CreateApiKeyInput & {
      key: string;
      createdBy: string;
      active: boolean;
    },
  ): Promise<ApiKey> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        name: payload.name,
        key: payload.key,
        created_by: payload.createdBy,
        expires_at: payload.expiresAt ?? null,
        active: payload.active,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Failed to create API key: ${error.message}`);
    return mapRow(data);
  }

  async update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey> {
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.expiresAt !== undefined)
      updateData.expires_at = payload.expiresAt;

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(`Failed to update API key: ${error.message}`);
    return mapRow(data);
  }

  async updateLastUsed(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`Failed to update last used: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

// --- Service ---

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;

export class ApiKeyService {
  constructor(private readonly repository: ApiKeyRepository) {}

  async list(createdBy?: string): Promise<ApiKey[]> {
    return createdBy
      ? this.repository.findByCreatedBy(createdBy)
      : this.repository.list();
  }

  async create(
    payload: CreateApiKeyInput,
    createdBy: string,
  ): Promise<ApiKey & { plainKey: string }> {
    const name = this.validateName(payload.name);
    const expiresAt = payload.expiresAt
      ? this.validateDateString(payload.expiresAt)
      : undefined;

    const plainKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(plainKey);

    const apiKey = await this.repository.create({
      name,
      key: hashedKey,
      createdBy,
      expiresAt,
      active: true,
    });

    return { ...apiKey, plainKey };
  }

  async update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey> {
    await this.ensureExists(id);
    const updateData: UpdateApiKeyInput = {};

    if (payload.name !== undefined)
      updateData.name = this.validateName(payload.name);
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.expiresAt !== undefined) {
      updateData.expiresAt = payload.expiresAt
        ? this.validateDateString(payload.expiresAt)
        : null;
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.delete(id);
  }

  async getById(id: string): Promise<ApiKey> {
    return this.ensureExists(id);
  }

  async validateApiKey(key: string): Promise<ApiKey> {
    const apiKey = await this.repository.findByKeyHash(this.hashApiKey(key));

    if (!apiKey) throw new ApiKeyNotFoundError("Invalid API key");
    if (!apiKey.active) throw new ApiKeyInactiveError("API key is inactive");
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new ApiKeyExpiredError("API key has expired");
    }

    await this.repository.updateLastUsed(apiKey.id);
    return apiKey;
  }

  private validateName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed) throw new ApiKeyValidationError("Name is required");
    if (trimmed.length < NAME_MIN_LENGTH) {
      throw new ApiKeyValidationError(
        `Name must have at least ${NAME_MIN_LENGTH} characters`,
      );
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new ApiKeyValidationError(
        `Name must have at most ${NAME_MAX_LENGTH} characters`,
      );
    }
    return trimmed;
  }

  private validateDateString(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime()))
      throw new ApiKeyValidationError("Invalid date format");
    return date.toISOString();
  }

  private generateApiKey(): string {
    return `sk_live_${randomBytes(16).toString("hex")}`;
  }

  private hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  private async ensureExists(id: string): Promise<ApiKey> {
    const apiKey = await this.repository.findById(id);
    if (!apiKey)
      throw new ApiKeyNotFoundError(`API key with id "${id}" was not found`);
    return apiKey;
  }
}
