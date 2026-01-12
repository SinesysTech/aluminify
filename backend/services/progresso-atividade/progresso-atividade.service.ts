import {
  ProgressoAtividade,
  UpdateProgressoInput,
  StatusAtividade,
} from './progresso-atividade.types';
import { ProgressoAtividadeRepository } from './progresso-atividade.repository';
import {
  ProgressoNotFoundError,
  ProgressoValidationError,
} from './progresso-atividade.errors';

export class ProgressoAtividadeService {
  constructor(private readonly repository: ProgressoAtividadeRepository) {}

  async getProgressoByAluno(alunoId: string): Promise<ProgressoAtividade[]> {
    if (!alunoId || !alunoId.trim()) {
      throw new ProgressoValidationError('Aluno ID is required');
    }
    return this.repository.listByAluno(alunoId);
  }

  async getProgressoById(id: string): Promise<ProgressoAtividade> {
    return this.ensureExists(id);
  }

  async getProgressoByAlunoAndAtividade(
    alunoId: string,
    atividadeId: string,
  ): Promise<ProgressoAtividade | null> {
    if (!alunoId || !alunoId.trim()) {
      throw new ProgressoValidationError('Aluno ID is required');
    }
    if (!atividadeId || !atividadeId.trim()) {
      throw new ProgressoValidationError('Atividade ID is required');
    }
    return this.repository.findByAlunoAndAtividade(alunoId, atividadeId);
  }

  async updateStatus(
    alunoId: string,
    atividadeId: string,
    status: StatusAtividade,
  ): Promise<ProgressoAtividade> {
    if (!alunoId || !alunoId.trim()) {
      throw new ProgressoValidationError('Aluno ID is required');
    }
    if (!atividadeId || !atividadeId.trim()) {
      throw new ProgressoValidationError('Atividade ID is required');
    }

    // Buscar ou criar progresso
    const progresso = await this.repository.findOrCreateProgresso(alunoId, atividadeId, status);

    const updateData: UpdateProgressoInput = {
      status,
    };

    // Definir datas conforme o status
    if (status === 'Pendente') {
      // Resetar progresso (mantém consistência para estatísticas/relatórios)
      updateData.dataInicio = null;
      updateData.dataConclusao = null;
      updateData.questoesTotais = 0;
      updateData.questoesAcertos = 0;
      updateData.dificuldadePercebida = null;
      updateData.anotacoesPessoais = null;
    } else if (status === 'Iniciado') {
      if (!progresso.dataInicio) {
        updateData.dataInicio = new Date();
      }
      // Se estava concluído e voltou para iniciado, remover conclusão e desempenho
      updateData.dataConclusao = null;
      updateData.questoesTotais = 0;
      updateData.questoesAcertos = 0;
      updateData.dificuldadePercebida = null;
      updateData.anotacoesPessoais = null;
    } else if (status === 'Concluido') {
      if (!progresso.dataInicio) {
        updateData.dataInicio = new Date();
      }
      if (!progresso.dataConclusao) {
        updateData.dataConclusao = new Date();
      }
    }

    return this.repository.update(progresso.id, updateData);
  }

  async marcarComoIniciado(alunoId: string, atividadeId: string): Promise<ProgressoAtividade> {
    return this.updateStatus(alunoId, atividadeId, 'Iniciado');
  }

  async marcarComoConcluido(alunoId: string, atividadeId: string): Promise<ProgressoAtividade> {
    return this.updateStatus(alunoId, atividadeId, 'Concluido');
  }

  async marcarComoConcluidoComDesempenho(
    alunoId: string,
    atividadeId: string,
    desempenho: {
      questoesTotais: number;
      questoesAcertos: number;
      dificuldadePercebida: 'Muito Facil' | 'Facil' | 'Medio' | 'Dificil' | 'Muito Dificil';
      anotacoesPessoais?: string | null;
    },
  ): Promise<ProgressoAtividade> {
    // Validações
    if (desempenho.questoesTotais < 1) {
      throw new ProgressoValidationError('Questões totais deve ser pelo menos 1');
    }

    if (desempenho.questoesAcertos < 0) {
      throw new ProgressoValidationError('Questões acertadas não pode ser negativo');
    }

    if (desempenho.questoesAcertos > desempenho.questoesTotais) {
      throw new ProgressoValidationError('Questões acertadas não pode ser maior que questões totais');
    }

    if (!desempenho.dificuldadePercebida) {
      throw new ProgressoValidationError('Dificuldade percebida é obrigatória');
    }

    // Buscar ou criar progresso
    const progresso = await this.repository.findOrCreateProgresso(alunoId, atividadeId, 'Concluido');

    const updateData: UpdateProgressoInput = {
      status: 'Concluido',
      dataConclusao: new Date(),
      questoesTotais: desempenho.questoesTotais,
      questoesAcertos: desempenho.questoesAcertos,
      dificuldadePercebida: desempenho.dificuldadePercebida,
      anotacoesPessoais: desempenho.anotacoesPessoais || null,
    };

    // Definir data de início se não existir
    if (!progresso.dataInicio) {
      updateData.dataInicio = new Date();
    }

    return this.repository.update(progresso.id, updateData);
  }

  async updateProgresso(id: string, payload: UpdateProgressoInput): Promise<ProgressoAtividade> {
    const progresso = await this.ensureExists(id);

    // Validações
    if (payload.dataConclusao && payload.dataInicio) {
      const inicio = payload.dataInicio instanceof Date ? payload.dataInicio : new Date(progresso.dataInicio || Date.now());
      const conclusao = payload.dataConclusao instanceof Date ? payload.dataConclusao : new Date(payload.dataConclusao);
      if (conclusao < inicio) {
        throw new ProgressoValidationError('Data de conclusão deve ser posterior à data de início');
      }
    } else if (payload.dataConclusao && progresso.dataInicio) {
      const conclusao = payload.dataConclusao instanceof Date ? payload.dataConclusao : new Date(payload.dataConclusao);
      const inicio = new Date(progresso.dataInicio);
      if (conclusao < inicio) {
        throw new ProgressoValidationError('Data de conclusão deve ser posterior à data de início');
      }
    }

    return this.repository.update(id, payload);
  }

  private async ensureExists(id: string): Promise<ProgressoAtividade> {
    if (!id || !id.trim()) {
      throw new ProgressoValidationError('Progresso ID is required');
    }
    
    const progresso = await this.repository.findById(id);
    if (!progresso) {
      throw new ProgressoNotFoundError(`Progresso with id "${id}" was not found`);
    }

    return progresso;
  }
}

