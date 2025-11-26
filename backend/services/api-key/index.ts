import { getDatabaseClient } from '@/backend/clients/database';
import { ApiKeyRepositoryImpl } from './api-key.repository';
import { ApiKeyService } from './api-key.service';

let _apiKeyService: ApiKeyService | null = null;

function getApiKeyService(): ApiKeyService {
  if (!_apiKeyService) {
    const databaseClient = getDatabaseClient();
    const repository = new ApiKeyRepositoryImpl(databaseClient);
    _apiKeyService = new ApiKeyService(repository);
  }
  return _apiKeyService;
}

export const apiKeyService = new Proxy({} as ApiKeyService, {
  get(_target, prop) {
    return getApiKeyService()[prop as keyof ApiKeyService];
  },
});

export * from './api-key.types';
export * from './api-key.service';
export * from './api-key.repository';
export * from './errors';

