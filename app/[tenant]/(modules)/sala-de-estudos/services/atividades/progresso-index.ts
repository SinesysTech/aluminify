import { getDatabaseClient } from "@/app/shared/core/database/database";
import { ProgressoAtividadeRepositoryImpl } from "./progresso.repository";
import { ProgressoAtividadeService } from "./progresso.service";

let _progressoAtividadeService: ProgressoAtividadeService | null = null;

function getProgressoAtividadeService(): ProgressoAtividadeService {
  if (!_progressoAtividadeService) {
    const databaseClient = getDatabaseClient();
    const repository = new ProgressoAtividadeRepositoryImpl(databaseClient);
    _progressoAtividadeService = new ProgressoAtividadeService(repository);
  }
  return _progressoAtividadeService;
}

export const progressoAtividadeService = new Proxy(
  {} as ProgressoAtividadeService,
  {
    get(_target, prop) {
      return getProgressoAtividadeService()[
        prop as keyof ProgressoAtividadeService
      ];
    },
  },
);

export * from "./progresso.types";
export * from "./progresso.service";
export * from "./progresso.repository";
export * from "./progresso.errors";
