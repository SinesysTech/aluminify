import { getDatabaseClient } from '@/backend/clients/database';
import { AtividadeRepositoryImpl } from './atividade.repository';
import { AtividadeService } from './atividade.service';

let _atividadeService: AtividadeService | null = null;

function getAtividadeService(): AtividadeService {
  if (!_atividadeService) {
    const databaseClient = getDatabaseClient();
    const repository = new AtividadeRepositoryImpl(databaseClient);
    _atividadeService = new AtividadeService(repository);
  }
  return _atividadeService;
}

export const atividadeService = new Proxy({} as AtividadeService, {
  get(_target, prop) {
    return getAtividadeService()[prop as keyof AtividadeService];
  },
});

export * from './atividade.types';
export * from './atividade.service';
export * from './atividade.repository';
export * from './errors';



