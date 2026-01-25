import { getDatabaseClient } from "@/app/shared/core/database/database";
import { ApiKeyRepositoryImpl, ApiKeyService } from "./api-key.service";

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

export * from "./api-key.service";
