import { getDatabaseClient } from '@/backend/clients/database';
import { ProgressoAtividadeRepositoryImpl } from './progresso-atividade.repository';
import { ProgressoAtividadeService } from './progresso-atividade.service';

let _progressoAtividadeService: ProgressoAtividadeService | null = null;

function getProgressoAtividadeService(): ProgressoAtividadeService {
  if (!_progressoAtividadeService) {
    const databaseClient = getDatabaseClient();
    const repository = new ProgressoAtividadeRepositoryImpl(databaseClient);
    _progressoAtividadeService = new ProgressoAtividadeService(repository);
  }
  return _progressoAtividadeService;
}

export const progressoAtividadeService = new Proxy({} as ProgressoAtividadeService, {
  get(_target, prop) {
    return getProgressoAtividadeService()[prop as keyof ProgressoAtividadeService];
  },
});

export * from './progresso-atividade.types';
export * from './progresso-atividade.service';
export * from './progresso-atividade.repository';
export * from './progresso-atividade.errors';



