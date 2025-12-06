import {
  Atividade,
  CreateAtividadeInput,
  UpdateAtividadeInput,
  AtividadeComProgressoEHierarquia,
  TipoAtividade,
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

  async create(input: CreateAtividadeInput): Promise<Atividade> {
    if (!input.moduloId || !input.moduloId.trim()) {
      throw new AtividadeValidationError('modulo_id is required');
    }
    if (!input.tipo) {
      throw new AtividadeValidationError('tipo is required');
    }
    if (!input.titulo || !input.titulo.trim()) {
      throw new AtividadeValidationError('titulo is required');
    }

    return this.repository.create({
      ...input,
      titulo: input.titulo.trim(),
    });
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

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    return this.repository.delete(id);
  }

  async listByAlunoMatriculas(alunoId: string): Promise<AtividadeComProgressoEHierarquia[]> {
    if (!alunoId || !alunoId.trim()) {
      throw new AtividadeValidationError('aluno_id is required');
    }

    const client = getDatabaseClient();
    const { listByAlunoMatriculasHelper } = await import('./atividade.repository-helper');
    return listByAlunoMatriculasHelper(client, alunoId);
  }

  private isMissingRulesTable(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message;
    return code === 'PGRST116' || code === '42P01' || (typeof message === 'string' && message.includes('regras_atividades'));
  }

  async gerarAtividadesPersonalizadas(cursoId: string, frenteId: string, _force = false): Promise<void> {
    if (!cursoId || !cursoId.trim()) {
      throw new AtividadeValidationError('curso_id is required');
    }
    if (!frenteId || !frenteId.trim()) {
      throw new AtividadeValidationError('frente_id is required');
    }

    const client = getDatabaseClient();

    // Recupera módulos da frente, em ordem, e já obtém o total para as regras
    const { data: modulos, error: modulosError } = await client
      .from('modulos')
      .select('id, numero_modulo')
      .eq('frente_id', frenteId)
      .order('numero_modulo', { ascending: true });

    if (modulosError) {
      throw new Error(`Failed to fetch modules: ${modulosError.message}`);
    }

    const orderedModules = modulos ?? [];
    const totalModulos = orderedModules.length;
    if (totalModulos === 0) {
      return;
    }

    const moduloIds = orderedModules.map((m) => m.id);

    // Limpa atividades existentes da frente antes de gerar novamente (espelha a função SQL)
    const { error: deleteError } = await client.from('atividades').delete().in('modulo_id', moduloIds);
    if (deleteError) {
      throw new Error(`Failed to clean activities before regeneration: ${deleteError.message}`);
    }

    // Busca regras do curso
    const { data: regras, error: regrasError } = await client
      .from('regras_atividades')
      .select(
        'id, tipo_atividade, nome_padrao, frequencia_modulos, comecar_no_modulo, acumulativo, gerar_no_ultimo',
      )
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: true });

    if (regrasError) {
      if (this.isMissingRulesTable(regrasError)) {
        // Sem migração aplicada: não gera atividades, mas não quebra o fluxo
        return;
      }
      throw new Error(`Failed to fetch activity rules: ${regrasError.message}`);
    }

    const insertPayload: Array<{
      modulo_id: string;
      tipo: TipoAtividade;
      titulo: string;
      ordem_exibicao: number;
    }> = [];

    for (const regra of regras ?? []) {
      let contador = 0;
      const frequencia = Math.max(regra.frequencia_modulos ?? 1, 1);
      const inicio = Math.max(regra.comecar_no_modulo ?? 1, 1);

      for (const modulo of orderedModules) {
        contador += 1;
        const geraPrincipal = contador >= inicio && ((contador - inicio) % frequencia === 0);

        if (geraPrincipal) {
          let titulo = regra.nome_padrao;
          if (regra.acumulativo) {
            const moduloInicio = Math.max(contador - frequencia + 1, inicio);
            titulo =
              moduloInicio === contador
                ? `${regra.nome_padrao} (Módulo ${contador})`
                : `${regra.nome_padrao} (Módulos ${moduloInicio} ao ${contador})`;
          }

          insertPayload.push({
            modulo_id: modulo.id,
            tipo: regra.tipo_atividade,
            titulo,
            ordem_exibicao: 10,
          });
        }

        const geraNoUltimo =
          regra.gerar_no_ultimo &&
          contador === totalModulos &&
          (contador < inicio || ((contador - inicio) % frequencia !== 0));

        if (geraNoUltimo) {
          insertPayload.push({
            modulo_id: modulo.id,
            tipo: regra.tipo_atividade,
            titulo: `${regra.nome_padrao} (Final)`,
            ordem_exibicao: 99,
          });
        }
      }
    }

    if (insertPayload.length === 0) {
      return;
    }

    const { error: insertError } = await client.from('atividades').insert(insertPayload);
    if (insertError) {
      throw new Error(`Failed to insert generated personalized activities: ${insertError.message}`);
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
