import {
  Atividade,
  UpdateAtividadeInput,
  AtividadeComProgressoEHierarquia,
} from './atividade.types';
import {
  AtividadeRepository,
} from './atividade.repository';
import {
  AtividadeNotFoundError,
  AtividadeValidationError,
} from './errors';
import { getDatabaseClient } from '@/backend/clients/database';

export class AtividadeService {
  constructor(private readonly repository: AtividadeRepository) {}

  async listByModulo(moduloId: string): Promise<Atividade[]> {
    return this.repository.listByModulo(moduloId);
  }

  async listByFrente(frenteId: string): Promise<Atividade[]> {
    return this.repository.listByFrente(frenteId);
  }

  async getById(id: string): Promise<Atividade> {
    return this.ensureExists(id);
  }

  async updateArquivoUrl(id: string, arquivoUrl: string): Promise<Atividade> {
    await this.ensureExists(id);

    if (!arquivoUrl || !arquivoUrl.trim()) {
      throw new AtividadeValidationError('arquivo_url is required');
    }

    return this.repository.update(id, { arquivoUrl: arquivoUrl.trim() });
  }

  async update(id: string, payload: UpdateAtividadeInput): Promise<Atividade> {
    await this.ensureExists(id);

    if (payload.arquivoUrl !== undefined && (!payload.arquivoUrl || !payload.arquivoUrl.trim())) {
      throw new AtividadeValidationError('arquivo_url cannot be empty');
    }

    return this.repository.update(id, payload);
  }

  async listByAlunoMatriculas(alunoId: string): Promise<AtividadeComProgressoEHierarquia[]> {
    if (!alunoId || !alunoId.trim()) {
      throw new AtividadeValidationError('aluno_id is required');
    }

    // Buscar atividades através do repository (que usa o helper)
    const client = getDatabaseClient();
    // Usar o helper diretamente do repository
    const { listByAlunoMatriculasHelper } = await import('./atividade.repository-helper');
    return listByAlunoMatriculasHelper(client, alunoId);
  }

  async gerarAtividadesPadrao(frenteId: string): Promise<void> {
    if (!frenteId || !frenteId.trim()) {
      throw new AtividadeValidationError('frente_id is required');
    }

    // Chamar a RPC function diretamente
    const client = getDatabaseClient();
    const { error } = await client.rpc('gerar_atividades_padrao', {
      p_frente_id: frenteId,
    });

    if (error) {
      throw new Error(`Failed to generate default activities: ${error.message}`);
    }
  }

  private async ensureExists(id: string): Promise<Atividade> {
    const atividade = await this.repository.findById(id);
    if (!atividade) {
      throw new AtividadeNotFoundError(id);
    }

    return atividade;
  }
}

