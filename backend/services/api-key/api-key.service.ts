import { randomBytes, createHash } from 'crypto';
import {
  ApiKey,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from './api-key.types';
import {
  ApiKeyRepository,
} from './api-key.repository';
import {
  ApiKeyExpiredError,
  ApiKeyInactiveError,
  ApiKeyNotFoundError,
  ApiKeyValidationError,
} from './errors';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;

export class ApiKeyService {
  constructor(private readonly repository: ApiKeyRepository) {}

  async list(createdBy?: string): Promise<ApiKey[]> {
    if (createdBy) {
      return this.repository.findByCreatedBy(createdBy);
    }
    return this.repository.list();
  }

  async create(payload: CreateApiKeyInput, createdBy: string): Promise<ApiKey & { plainKey: string }> {
    const name = this.validateName(payload.name);
    const expiresAt = payload.expiresAt ? this.validateDateString(payload.expiresAt) : undefined;

    // Gerar chave única
    const plainKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(plainKey);

    const apiKey = await this.repository.create({
      name,
      key: hashedKey,
      createdBy,
      expiresAt,
      active: true,
    });

    return {
      ...apiKey,
      plainKey, // Retornar apenas uma vez para o usuário salvar
    };
  }

  async update(id: string, payload: UpdateApiKeyInput): Promise<ApiKey> {
    await this.ensureExists(id);

    const updateData: UpdateApiKeyInput = {};

    if (payload.name !== undefined) {
      updateData.name = this.validateName(payload.name);
    }

    if (payload.active !== undefined) {
      updateData.active = payload.active;
    }

    if (payload.expiresAt !== undefined) {
      updateData.expiresAt = payload.expiresAt ? this.validateDateString(payload.expiresAt) : null;
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

    if (!apiKey) {
      throw new ApiKeyNotFoundError('Invalid API key');
    }

    if (!apiKey.active) {
      throw new ApiKeyInactiveError('API key is inactive');
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new ApiKeyExpiredError('API key has expired');
    }

    // Atualizar lastUsedAt
    await this.repository.updateLastUsed(apiKey.id);

    return apiKey;
  }

  private validateName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new ApiKeyValidationError('Name is required');
    }

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

  private validateDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ApiKeyValidationError('Invalid date format');
    }
    return date;
  }

  private validateDateString(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ApiKeyValidationError('Invalid date format');
    }
    return date.toISOString();
  }

  private generateApiKey(): string {
    // Formato: sk_live_<32 caracteres hexadecimais>
    const randomPart = randomBytes(16).toString('hex');
    return `sk_live_${randomPart}`;
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private async ensureExists(id: string): Promise<ApiKey> {
    const apiKey = await this.repository.findById(id);
    if (!apiKey) {
      throw new ApiKeyNotFoundError(`API key with id "${id}" was not found`);
    }
    return apiKey;
  }
}

