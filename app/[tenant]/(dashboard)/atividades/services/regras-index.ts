import { getDatabaseClient } from "@/app/shared/core/database/database";
import { RegraAtividadeRepositoryImpl } from "./regras.repository";
import { RegraAtividadeService } from "./regras.service";

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

export * from "./regras.types";
export * from "./regras.service";
export * from "./regras.repository";
export * from "./regras.errors";
