import { getDatabaseClient } from '@/backend/clients/database';
import { RegraAtividadeRepositoryImpl } from './regras-atividade.repository';
import { RegraAtividadeService } from './regras-atividade.service';

let _regraAtividadeService: RegraAtividadeService | null = null;

function getRegraAtividadeService(): RegraAtividadeService {
  if (!_regraAtividadeService) {
    const client = getDatabaseClient();
    const repository = new RegraAtividadeRepositoryImpl(client);
    _regraAtividadeService = new RegraAtividadeService(repository);
  }

  return _regraAtividadeService;
}

export const regraAtividadeService = new Proxy({} as RegraAtividadeService, {
  get(_target, prop) {
    return getRegraAtividadeService()[prop as keyof RegraAtividadeService];
  },
});

export * from './regras-atividade.types';
export * from './regras-atividade.service';
export * from './regras-atividade.repository';
export * from './errors';
