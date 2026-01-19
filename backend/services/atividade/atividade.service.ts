import {
  Atividade,
  CreateAtividadeInput,
  UpdateAtividadeInput,
  AtividadeComProgressoEHierarquia,
  TipoAtividade,
} from "./atividade.types";
import { AtividadeRepository } from "./atividade.repository";
import { AtividadeNotFoundError, AtividadeValidationError } from "./errors";
import { getDatabaseClient } from "@/backend/clients/database";
import { activityCacheService } from "@/backend/services/cache/activity-cache.service";

export class AtividadeService {
  constructor(private readonly repository: AtividadeRepository) {}

  async listByModulo(moduloId: string): Promise<Atividade[]> {
    // Usar cache para estrutura de atividades (sem progresso)
    const cached = await activityCacheService.getActivitiesByModulo(moduloId);

    // Converter dados do cache para formato Atividade completo
    return cached.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      nome: a.titulo,
      moduloId: a.moduloId,
      modulo_id: a.moduloId,
      tipo: a.tipo as TipoAtividade,
      arquivoUrl: a.arquivoUrl,
      arquivo_url: a.arquivoUrl,
      gabaritoUrl: a.gabaritoUrl,
      gabarito_url: a.gabaritoUrl,
      linkExterno: a.linkExterno,
      link_externo: a.linkExterno,
      obrigatorio: a.obrigatorio,
      ordemExibicao: a.ordemExibicao,
      ordem_exibicao: a.ordemExibicao,
      createdBy: null,
      createdAt: new Date(a.createdAt),
      created_at: a.createdAt,
      updatedAt: new Date(a.updatedAt),
      updated_at: a.updatedAt,
    }));
  }

  async listByFrente(frenteId: string): Promise<Atividade[]> {
    return this.repository.listByFrente(frenteId);
  }

  async getById(id: string): Promise<Atividade> {
    return this.ensureExists(id);
  }

  async create(input: CreateAtividadeInput): Promise<Atividade> {
    if (!input.moduloId || !input.moduloId.trim()) {
      throw new AtividadeValidationError("modulo_id is required");
    }
    if (!input.tipo) {
      throw new AtividadeValidationError("tipo is required");
    }
    if (!input.titulo || !input.titulo.trim()) {
      throw new AtividadeValidationError("titulo is required");
    }

    const atividade = await this.repository.create({
      ...input,
      titulo: input.titulo.trim(),
    });

    // Invalidar cache do módulo
    await activityCacheService.invalidateModulo(input.moduloId);

    return atividade;
  }

  async updateArquivoUrl(id: string, arquivoUrl: string): Promise<Atividade> {
    const existing = await this.ensureExists(id);

    if (!arquivoUrl || !arquivoUrl.trim()) {
      throw new AtividadeValidationError("arquivo_url is required");
    }

    const atividade = await this.repository.update(id, {
      arquivoUrl: arquivoUrl.trim(),
    });

    // Invalidar cache do módulo
    await activityCacheService.invalidateModulo(existing.moduloId);

    return atividade;
  }

  async update(id: string, payload: UpdateAtividadeInput): Promise<Atividade> {
    const existing = await this.ensureExists(id);

    if (
      payload.arquivoUrl !== undefined &&
      (!payload.arquivoUrl || !payload.arquivoUrl.trim())
    ) {
      throw new AtividadeValidationError("arquivo_url cannot be empty");
    }

    const atividade = await this.repository.update(id, payload);

    // Invalidar cache do módulo (qualquer atualização invalida o cache)
    await activityCacheService.invalidateModulo(existing.moduloId);

    return atividade;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.ensureExists(id);
    await this.repository.delete(id);

    // Invalidar cache do módulo
    await activityCacheService.invalidateModulo(existing.moduloId);
  }

  async listByAlunoMatriculas(
    alunoId: string,
  ): Promise<AtividadeComProgressoEHierarquia[]> {
    if (!alunoId || !alunoId.trim()) {
      throw new AtividadeValidationError("aluno_id is required");
    }

    const client = getDatabaseClient();
    const { listByAlunoMatriculasHelper } =
      await import("./atividade.repository-helper");
    return listByAlunoMatriculasHelper(client, alunoId);
  }

  async gerarAtividadesPersonalizadas(
    cursoId: string,
    frenteId: string,
    empresaId: string,
  ): Promise<void> {
    if (!cursoId || !cursoId.trim()) {
      throw new AtividadeValidationError("curso_id is required");
    }
    if (!frenteId || !frenteId.trim()) {
      throw new AtividadeValidationError("frente_id is required");
    }
    if (!empresaId || !empresaId.trim()) {
      throw new AtividadeValidationError("empresa_id is required");
    }

    const client = getDatabaseClient();

    // Recupera módulos da frente, em ordem, e já obtém o total para as regras
    const { data: modulos, error: modulosError } = await client
      .from("modulos")
      .select("id, numero_modulo")
      .eq("frente_id", frenteId)
      .order("numero_modulo", { ascending: true });

    if (modulosError) {
      throw new Error(`Failed to fetch modules: ${modulosError.message}`);
    }

    const orderedModules = modulos ?? [];
    const totalModulos = orderedModules.length;
    if (totalModulos === 0) {
      return;
    }

    const moduloIds = orderedModules.map((m) => m.id);

    // Limpar referências em sessoes_estudo antes de deletar atividades para evitar FK
    const { data: atividadesExistentes, error: atividadesFetchError } =
      await client.from("atividades").select("id").in("modulo_id", moduloIds);
    if (atividadesFetchError) {
      throw new Error(
        `Failed to fetch activities before regeneration: ${atividadesFetchError.message}`,
      );
    }
    const atividadeIdsParaLimpar = (atividadesExistentes ?? []).map(
      (a) => a.id,
    );
    if (atividadeIdsParaLimpar.length > 0) {
      const { error: clearSessaoError } = await client
        .from("sessoes_estudo")
        .update({ atividade_relacionada_id: null })
        .in("atividade_relacionada_id", atividadeIdsParaLimpar);
      if (clearSessaoError) {
        throw new Error(
          `Failed to clear study sessions before regeneration: ${clearSessaoError.message}`,
        );
      }
    }

    // Limpa atividades existentes da frente antes de gerar novamente (espelha a função SQL)
    const { error: deleteError } = await client
      .from("atividades")
      .delete()
      .in("modulo_id", moduloIds);
    if (deleteError) {
      throw new Error(
        `Failed to clean activities before regeneration: ${deleteError.message}`,
      );
    }

    // Invalidar cache de todos os módulos afetados
    await activityCacheService.invalidateModulos(moduloIds);

    // Busca regras do curso
    const { data: regras, error: regrasError } = await client
      .from("regras_atividades")
      .select(
        "id, tipo_atividade, nome_padrao, frequencia_modulos, comecar_no_modulo, acumulativo, acumulativo_desde_inicio, gerar_no_ultimo",
      )
      .eq("curso_id", cursoId)
      .order("created_at", { ascending: true });

    if (regrasError) {
      throw new Error(`Failed to fetch activity rules: ${regrasError.message}`);
    }

    const insertPayload: Array<{
      modulo_id: string;
      tipo: TipoAtividade;
      titulo: string;
      ordem_exibicao: number;
      empresa_id: string;
    }> = [];

    for (const regra of regras ?? []) {
      let contador = 0;
      const frequencia = Math.max(regra.frequencia_modulos ?? 1, 1);
      const inicio = Math.max(regra.comecar_no_modulo ?? 1, 1);

      for (const modulo of orderedModules) {
        contador += 1;
        const geraPrincipal =
          contador >= inicio && (contador - inicio) % frequencia === 0;

        if (geraPrincipal) {
          let titulo = regra.nome_padrao;
          if (regra.acumulativo) {
            // Se acumulativo_desde_inicio = true, sempre começa do módulo 1
            // Se false, usa o intervalo baseado na frequência (comportamento original)
            const moduloInicio = regra.acumulativo_desde_inicio
              ? 1
              : Math.max(contador - frequencia + 1, inicio);
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
            empresa_id: empresaId,
          });
        }

        const geraNoUltimo =
          regra.gerar_no_ultimo &&
          contador === totalModulos &&
          (contador < inicio || (contador - inicio) % frequencia !== 0);

        if (geraNoUltimo) {
          insertPayload.push({
            modulo_id: modulo.id,
            tipo: regra.tipo_atividade,
            titulo: `${regra.nome_padrao} (Final)`,
            ordem_exibicao: 99,
            empresa_id: empresaId,
          });
        }
      }
    }

    if (insertPayload.length === 0) {
      return;
    }

    const { error: insertError } = await client
      .from("atividades")
      .insert(insertPayload);
    if (insertError) {
      throw new Error(
        `Failed to insert generated personalized activities: ${insertError.message}`,
      );
    }

    // Invalidar cache dos módulos onde atividades foram criadas
    const moduloIdsComAtividades = [
      ...new Set(insertPayload.map((p) => p.modulo_id)),
    ];
    await activityCacheService.invalidateModulos(moduloIdsComAtividades);
  }

  private async ensureExists(id: string): Promise<Atividade> {
    const atividade = await this.repository.findById(id);
    if (!atividade) {
      throw new AtividadeNotFoundError(id);
    }

    return atividade;
  }
}
