import { getDatabaseClient } from '@/backend/clients/database';
import { ApiKeyRepositoryImpl } from './api-key.repository';
import { ApiKeyService } from './api-key.service';

const databaseClient = getDatabaseClient();
const repository = new ApiKeyRepositoryImpl(databaseClient);
export const apiKeyService = new ApiKeyService(repository);

export * from './api-key.types';
export * from './api-key.service';
export * from './api-key.repository';
export * from './errors';

