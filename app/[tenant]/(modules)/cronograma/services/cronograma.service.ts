import {
  getDatabaseClient,
  clearDatabaseClientCache,
} from "@/app/shared/core/database/database";
import type { Database } from "@/app/shared/core/database.types";
import {
  GerarCronogramaInput,
  GerarCronogramaResult,
  AulaCompleta,
  SemanaInfo,
  ItemDistribuicao,
  CronogramaSemanasDias,
  AtualizarDistribuicaoDiasInput,
  RecalcularDatasResult,
  SemanaEstatisticas,
  EstatisticasSemanasResult,
  CronogramaDetalhado,
  FeriasPeriodo,
} from "./cronograma.types";
import {
  FrenteValidacaoResult,
  FrenteStatsAccumulator,
  FrenteCountAccumulator,
  FrenteComCursoDiferenteAccumulator,
  AulaQueryResult,
  ModuloQueryResult,
  DiagnosticoFrente,
  FrenteInfo,
  ModuloInfo,
  ModuloSelecionadoQueryResult,
  FrenteQueryResult,
  getFirst,
  getDisciplinaNome,
  getFrenteInfo,
  getModuloInfo,
} from "./cronograma.query-types";
import {
  CronogramaValidationError,
  CronogramaTempoInsuficienteError,
  CronogramaConflictError,
} from "./errors";

const TEMPO_PADRAO_MINUTOS = 10;
const FATOR_MULTIPLICADOR = 1.5;

// Helper para logs que só aparecem em desenvolvimento
const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};

const logError = (...args: unknown[]) => {
  console.error(...args);
};

// Helper to map database row to CronogramaDetalhado
function mapToCronogramaDetalhado(
  row: Database["public"]["Tables"]["cronogramas"]["Row"],
): CronogramaDetalhado {
  return {
    id: row.id,
    aluno_id: row.aluno_id,
    curso_alvo_id: row.curso_alvo_id,
    nome: row.nome ?? "Meu Cronograma",
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    dias_estudo_semana: row.dias_estudo_semana,
    horas_estudo_dia: row.horas_estudo_dia,
    periodos_ferias: (row.periodos_ferias as unknown as FeriasPeriodo[]) ?? [],
    prioridade_minima: row.prioridade_minima,
    modalidade_estudo: row.modalidade_estudo as "paralelo" | "sequencial",
    disciplinas_selecionadas:
      (row.disciplinas_selecionadas as unknown as string[]) ?? [],
    ordem_frentes_preferencia:
      (row.ordem_frentes_preferencia as unknown as string[]) ?? null,
    modulos_selecionados:
      (row.modulos_selecionados as unknown as string[]) ?? null,
    excluir_aulas_concluidas: row.excluir_aulas_concluidas,
    velocidade_reproducao:
      ((row as Record<string, unknown>).velocidade_reproducao as number) ?? 1.0,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export class CronogramaService {
  async gerarCronograma(
    input: GerarCronogramaInput,
    userId: string,
    userEmail?: string,
    empresaId?: string,
  ): Promise<GerarCronogramaResult> {
    logDebug("[CronogramaService] Iniciando geração de cronograma:", {
      aluno_id: input.aluno_id,
      userId,
      userEmail,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim,
      disciplinas_count: input.disciplinas_ids?.length || 0,
    });

    // Validações básicas
    if (!input.aluno_id || !input.data_inicio || !input.data_fim) {
      throw new CronogramaValidationError(
        "Campos obrigatórios: aluno_id, data_inicio, data_fim",
      );
    }

    // Verificar se aluno_id corresponde ao usuário autenticado
    if (input.aluno_id !== userId) {
      throw new CronogramaValidationError(
        "Você só pode criar cronogramas para si mesmo",
      );
    }

    // Validar datas
    const dataInicio = new Date(input.data_inicio);
    const dataFim = new Date(input.data_fim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      throw new CronogramaValidationError("Datas inválidas");
    }

    if (dataFim <= dataInicio) {
      throw new CronogramaValidationError(
        "data_fim deve ser posterior a data_inicio",
      );
    }

    const client = getDatabaseClient();

    // Resolver empresa_id (prioriza metadata; faz fallback para tabela alunos)
    const resolvedEmpresaId = await this.resolveEmpresaId(
      client,
      userId,
      empresaId,
    );
    if (!resolvedEmpresaId) {
      throw new CronogramaValidationError(
        "Empresa não encontrada para o usuário autenticado (empresa_id ausente).",
      );
    }

    // Verificar se aluno_id corresponde ao usuário autenticado, se não existir, criar
    await this.ensureAlunoExists(client, userId, userEmail, resolvedEmpresaId);

    // Deletar cronograma anterior do aluno (se existir)
    await this.deletarCronogramaAnterior(client, userId);

    const excluirConcluidas = input.excluir_aulas_concluidas !== false;
    const aulasConcluidas = excluirConcluidas
      ? await this.buscarAulasConcluidas(
          client,
          input.aluno_id,
          input.curso_alvo_id,
        )
      : new Set<string>();

    // ============================================
    // ETAPA 1: Cálculo de Capacidade
    // ============================================

    const semanas = this.calcularSemanas(
      dataInicio,
      dataFim,
      input.ferias,
      input.horas_dia,
      input.dias_semana,
    );
    const capacidadeTotal = semanas
      .filter((s) => !s.is_ferias)
      .reduce((acc, s) => acc + s.capacidade_minutos, 0);

    // ============================================
    // ETAPA 2: Busca e Filtragem de Aulas
    // ============================================

    const aulasBase = await this.buscarAulas(
      client,
      input.disciplinas_ids,
      input.prioridade_minima,
      input.curso_alvo_id,
      input.modulos_ids,
    );

    const aulas = excluirConcluidas
      ? aulasBase.filter((aula) => !aulasConcluidas.has(aula.id))
      : aulasBase;

    if (!aulas.length) {
      throw new CronogramaValidationError(
        "Nenhuma aula disponível após aplicar os filtros selecionados.",
      );
    }

    // Validar que todas as frentes das disciplinas selecionadas têm aulas
    // Buscar todas as frentes das disciplinas selecionadas para validação
    let validacaoFrentesQuery = client
      .from("frentes")
      .select("id, nome, disciplina_id, curso_id, disciplinas(nome)")
      .in("disciplina_id", input.disciplinas_ids);

    if (input.curso_alvo_id) {
      validacaoFrentesQuery = validacaoFrentesQuery.eq(
        "curso_id",
        input.curso_alvo_id,
      );
    }

    const { data: todasFrentes, error: frentesError } =
      await validacaoFrentesQuery;

    // Type assertion needed: Supabase doesn't infer join types automatically
    // The query joins frentes with disciplinas table to get disciplina name
    type FrenteWithDisciplina = {
      id: string;
      nome: string;
      disciplina_id: string;
      curso_id: string;
      disciplinas: { nome: string } | null;
    };

    if (!frentesError && todasFrentes && todasFrentes.length > 0) {
      const typedFrentes = todasFrentes as unknown as FrenteWithDisciplina[];
      const frentesComAulas = new Set(aulas.map((a) => a.frente_id));
      const frentesSemAulas = typedFrentes.filter(
        (f) => !frentesComAulas.has(f.id),
      );

      if (frentesSemAulas.length > 0) {
        console.warn(
          "[CronogramaService] ⚠️ Frentes sem aulas no cronograma gerado:",
          {
            total_frentes_sem_aulas: frentesSemAulas.length,
            total_frentes_esperadas: todasFrentes.length,
            total_frentes_com_aulas: frentesComAulas.size,
            frentes: frentesSemAulas.map((f: FrenteValidacaoResult) => ({
              id: f.id,
              nome: f.nome,
              disciplina: getDisciplinaNome(f.disciplinas) || "Desconhecida",
              curso_id: f.curso_id,
            })),
            motivo_possivel: excluirConcluidas
              ? "Aulas podem ter sido excluídas por estarem concluídas ou não terem prioridade suficiente"
              : "Aulas podem não ter prioridade suficiente ou módulos não foram selecionados",
            prioridade_minima: input.prioridade_minima,
            modulos_selecionados: input.modulos_ids?.length || 0,
          },
        );
      } else {
        console.log(
          "[CronogramaService] ✅ Todas as frentes selecionadas têm aulas no cronograma",
        );
      }
    }

    // ============================================
    // ETAPA 3: Cálculo de Custo Real
    // ============================================

    // Velocidade de reprodução padrão: 1.00x
    const velocidadeReproducao = input.velocidade_reproducao ?? 1.0;

    // Tempo de aula ajustado pela velocidade: se assistir em 1.5x, o tempo real é reduzido
    // Tempo de estudo (anotações/exercícios) é calculado sobre o tempo de aula ajustado
    const aulasComCusto = aulas.map((aula) => {
      const tempoOriginal = aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS;
      const tempoAulaAjustado = tempoOriginal / velocidadeReproducao;
      // Custo = tempo de aula (ajustado) + tempo de estudo (calculado sobre o tempo ajustado)
      const custo = tempoAulaAjustado * FATOR_MULTIPLICADOR;
      return {
        ...aula,
        custo,
      };
    });

    const custoTotalNecessario = aulasComCusto.reduce(
      (acc, aula) => acc + aula.custo,
      0,
    );

    const semanasUteis = semanas.filter((s) => !s.is_ferias);
    if (semanasUteis.length === 0) {
      throw new CronogramaValidationError(
        "Nenhuma semana útil disponível no período informado (todas as semanas estão marcadas como férias/folgas).",
      );
    }

    // ============================================
    // ETAPA 4: Verificação de Viabilidade
    // ============================================

    if (custoTotalNecessario > capacidadeTotal) {
      const horasNecessarias = custoTotalNecessario / 60;
      const horasDisponiveis = capacidadeTotal / 60;
      const semanasUteisCount = semanasUteis.length;
      const horasDiaNecessarias =
        horasNecessarias / (semanasUteisCount * input.dias_semana);

      throw new CronogramaTempoInsuficienteError("Tempo insuficiente", {
        horas_necessarias: Math.ceil(horasNecessarias),
        horas_disponiveis: Math.ceil(horasDisponiveis),
        horas_dia_necessarias: Math.ceil(horasDiaNecessarias * 10) / 10,
        horas_dia_atual: input.horas_dia,
      });
    }

    // ============================================
    // ETAPA 4.1: Viabilidade semanal (presença obrigatória)
    // ============================================
    // Requisito novo:
    // - Paralelo: toda semana útil deve ter pelo menos 1 item por frente.
    // - Sequencial: toda semana útil deve ter pelo menos 1 item por disciplina.
    const capacidadeSemanalMin = Math.min(
      ...semanasUteis.map((s) => s.capacidade_minutos),
    );
    this.validarViabilidadeSemanal(
      input.modalidade,
      aulasComCusto,
      capacidadeSemanalMin,
    );

    // ============================================
    // ETAPA 5: Algoritmo de Distribuição
    // ============================================

    const itens = this.distribuirAulas(
      aulasComCusto,
      semanas,
      input.modalidade,
      input.ordem_frentes_preferencia,
    );

    if (itens.length === 0) {
      console.error(
        "[CronogramaService] Nenhum item foi criado na distribuição!",
        {
          totalAulas: aulasComCusto.length,
          totalSemanas: semanas.length,
          semanasUteis: semanas.filter((s) => !s.is_ferias).length,
          modalidade: input.modalidade,
        },
      );
      throw new CronogramaValidationError(
        "Nenhuma aula foi distribuída. Verifique se há semanas úteis disponíveis e se as aulas selecionadas são compatíveis com o período.",
      );
    }

    logDebug("[CronogramaService] Distribuição concluída:", {
      totalItens: itens.length,
      semanasComItens: new Set(itens.map((i) => i.semana_numero)).size,
    });

    // ============================================
    // ETAPA 6: Persistência
    // ============================================

    const cronograma = await this.persistirCronograma(
      client,
      input,
      itens,
      resolvedEmpresaId,
    );

    return {
      success: true,
      cronograma,
      estatisticas: {
        total_aulas: aulas.length,
        total_semanas: semanas.length,
        semanas_uteis: semanasUteis.length,
        capacidade_total_minutos: capacidadeTotal,
        custo_total_minutos: custoTotalNecessario,
        frentes_distribuidas: new Set(aulas.map((a) => a.frente_id)).size,
      },
    };
  }

  private validarViabilidadeSemanal(
    modalidade: "paralelo" | "sequencial",
    aulasComCusto: Array<AulaCompleta & { custo: number }>,
    capacidadeSemanalMin: number,
  ): void {
    if (!Number.isFinite(capacidadeSemanalMin) || capacidadeSemanalMin <= 0) {
      throw new CronogramaValidationError(
        "Capacidade semanal inválida (horas/dia ou dias/semana não resultam em tempo útil).",
      );
    }

    if (modalidade === "paralelo") {
      // 1 item por frente por semana
      const minPorFrente = new Map<string, number>();
      aulasComCusto.forEach((a) => {
        const prev = minPorFrente.get(a.frente_id);
        if (prev === undefined || a.custo < prev) {
          minPorFrente.set(a.frente_id, a.custo);
        }
      });
      const minimoSemanalNecessario = Array.from(minPorFrente.values()).reduce(
        (acc, v) => acc + v,
        0,
      );

      if (minimoSemanalNecessario > capacidadeSemanalMin) {
        throw new CronogramaTempoInsuficienteError(
          "Tempo insuficiente para garantir todas as frentes em todas as semanas",
          {
            minimo_semanal_necessario_minutos: Math.ceil(minimoSemanalNecessario),
            capacidade_semanal_minutos: Math.floor(capacidadeSemanalMin),
            total_frentes: minPorFrente.size,
            regra: "paralelo: 1 item por frente por semana",
          } as Record<string, unknown>,
        );
      }
      return;
    }

    // sequencial: 1 item por disciplina por semana
    const minPorDisciplina = new Map<string, number>();
    aulasComCusto.forEach((a) => {
      const prev = minPorDisciplina.get(a.disciplina_id);
      if (prev === undefined || a.custo < prev) {
        minPorDisciplina.set(a.disciplina_id, a.custo);
      }
    });
    const minimoSemanalNecessario = Array.from(minPorDisciplina.values()).reduce(
      (acc, v) => acc + v,
      0,
    );

    if (minimoSemanalNecessario > capacidadeSemanalMin) {
      throw new CronogramaTempoInsuficienteError(
        "Tempo insuficiente para garantir todas as disciplinas em todas as semanas",
        {
          minimo_semanal_necessario_minutos: Math.ceil(minimoSemanalNecessario),
          capacidade_semanal_minutos: Math.floor(capacidadeSemanalMin),
          total_disciplinas: minPorDisciplina.size,
          regra: "sequencial: 1 item por disciplina por semana",
        } as Record<string, unknown>,
      );
    }
  }

  private async deletarCronogramaAnterior(
    client: ReturnType<typeof getDatabaseClient>,
    userId: string,
  ): Promise<void> {
    console.log(
      "[CronogramaService] Verificando e deletando cronograma anterior...",
    );

    // Buscar cronograma existente do aluno
    const { data: cronogramaExistente, error: selectError } = await client
      .from("cronogramas")
      .select("id")
      .eq("aluno_id", userId)
      .maybeSingle();

    if (selectError) {
      console.error(
        "[CronogramaService] Erro ao verificar cronograma existente:",
        selectError,
      );
      // Não lançar erro, apenas logar - pode não existir cronograma anterior
      return;
    }

    if (cronogramaExistente) {
      console.log(
        "[CronogramaService] Deletando cronograma anterior:",
        cronogramaExistente.id,
      );

      // Deletar cronograma (cascade vai deletar os itens automaticamente devido ao ON DELETE CASCADE)
      const { error: deleteError } = await client
        .from("cronogramas")
        .delete()
        .eq("id", cronogramaExistente.id);

      if (deleteError) {
        console.error(
          "[CronogramaService] Erro ao deletar cronograma anterior:",
          deleteError,
        );
        throw new Error(
          `Erro ao deletar cronograma anterior: ${deleteError.message}`,
        );
      }

      console.log(
        "[CronogramaService] Cronograma anterior deletado com sucesso",
      );
    } else {
      console.log("[CronogramaService] Nenhum cronograma anterior encontrado");
    }
  }

  private async ensureAlunoExists(
    client: ReturnType<typeof getDatabaseClient>,
    userId: string,
    userEmail?: string,
    empresaId?: string,
  ): Promise<void> {
    // Verificar se o aluno já existe
    const { data: alunoExistente, error: selectError } = await client
      .from("alunos")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.error(
        "[CronogramaService] Erro ao verificar aluno:",
        selectError,
      );
      throw new Error(`Erro ao verificar aluno: ${selectError.message}`);
    }

    // Se o aluno não existe, criar um registro básico
    if (!alunoExistente) {
      console.log(
        "[CronogramaService] Aluno não encontrado, criando registro...",
      );

      if (!userEmail) {
        throw new CronogramaValidationError(
          "Email do usuário é necessário para criar o registro de aluno",
        );
      }

      if (!empresaId) {
        throw new CronogramaValidationError(
          "Empresa não encontrada para criar o registro de aluno (empresa_id ausente).",
        );
      }

      const { error: insertError } = await client.from("alunos").insert({
        id: userId,
        email: userEmail,
        empresa_id: empresaId,
      });

      if (insertError) {
        console.error("[CronogramaService] Erro ao criar aluno:", insertError);
        throw new Error(
          `Erro ao criar registro de aluno: ${insertError.message}`,
        );
      }

      console.log("[CronogramaService] Registro de aluno criado com sucesso");
    }
  }

  private async resolveEmpresaId(
    client: ReturnType<typeof getDatabaseClient>,
    userId: string,
    empresaId?: string,
  ): Promise<string | undefined> {
    if (empresaId) return empresaId;

    const { data, error } = await client
      .from("alunos")
      .select("empresa_id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        "[CronogramaService] Erro ao resolver empresa_id do aluno:",
        error,
      );
      return undefined;
    }

    return (data?.empresa_id as string | null | undefined) ?? undefined;
  }

  private calcularSemanas(
    dataInicio: Date,
    dataFim: Date,
    ferias: Array<{ inicio: string; fim: string }>,
    horasDia: number,
    diasSemana: number,
  ): SemanaInfo[] {
    const semanas: SemanaInfo[] = [];
    const inicio = new Date(dataInicio);
    let semanaNumero = 1;

    while (inicio <= dataFim) {
      const fimSemana = new Date(inicio);
      fimSemana.setDate(fimSemana.getDate() + 6); // 7 dias (0-6)

      // Verificar se a semana cai em período de férias
      let isFerias = false;
      for (const periodo of ferias || []) {
        const inicioFerias = new Date(periodo.inicio);
        const fimFerias = new Date(periodo.fim);
        if (
          (inicio >= inicioFerias && inicio <= fimFerias) ||
          (fimSemana >= inicioFerias && fimSemana <= fimFerias) ||
          (inicio <= inicioFerias && fimSemana >= fimFerias)
        ) {
          isFerias = true;
          break;
        }
      }

      semanas.push({
        numero: semanaNumero,
        data_inicio: new Date(inicio),
        data_fim: fimSemana > dataFim ? new Date(dataFim) : fimSemana,
        is_ferias: isFerias,
        capacidade_minutos: isFerias ? 0 : horasDia * diasSemana * 60,
      });

      inicio.setDate(inicio.getDate() + 7);
      semanaNumero++;
    }

    return semanas;
  }

  private async buscarAulas(
    client: ReturnType<typeof getDatabaseClient>,
    disciplinasIds: string[],
    prioridadeMinima: number,
    cursoId?: string,
    modulosSelecionados?: string[],
  ): Promise<AulaCompleta[]> {
    const prioridadeMinimaEfetiva = Math.max(1, prioridadeMinima ?? 1);
    console.log(
      "🔍 [CronogramaService] ===========================================",
    );
    console.log("🔍 [CronogramaService] INICIANDO BUSCA DE AULAS");
    console.log("🔍 [CronogramaService] Disciplinas:", disciplinasIds);
    console.log("🔍 [CronogramaService] Curso ID:", cursoId);
    console.log(
      "🔍 [CronogramaService] Módulos selecionados:",
      modulosSelecionados?.length || 0,
    );
    console.log(
      "🔍 [CronogramaService] Prioridade mínima:",
      prioridadeMinimaEfetiva,
    );
    console.log(
      "🔍 [CronogramaService] ===========================================",
    );

    // Buscar frentes das disciplinas selecionadas (com informações completas para validação)
    console.log(
      "🔍 [CronogramaService] ========== DIAGNÓSTICO DE FRENTES ==========",
    );
    console.log("[CronogramaService] Buscando frentes para:", {
      disciplinas_ids: disciplinasIds,
      curso_id: cursoId,
      total_disciplinas: disciplinasIds.length,
    });

    // PRIMEIRO: Buscar TODAS as frentes das disciplinas (sem filtro de curso) para diagnóstico
    const { data: todasFrentesSemFiltro, error: todasFrentesError } =
      await client
        .from("frentes")
        .select("id, nome, disciplina_id, curso_id, disciplinas(nome)")
        .in("disciplina_id", disciplinasIds);

    if (todasFrentesError) {
      console.error(
        "[CronogramaService] Erro ao buscar todas as frentes (diagnóstico):",
        todasFrentesError,
      );
    } else {
      console.log(
        "[CronogramaService] TOTAL de frentes encontradas (SEM filtro de curso):",
        todasFrentesSemFiltro?.length || 0,
      );

      // Agrupar por disciplina e curso
      const frentesPorDisciplinaECurso = new Map<
        string,
        { disciplina: string; frentes: FrenteInfo[] }
      >();
      todasFrentesSemFiltro?.forEach((frente: FrenteValidacaoResult) => {
        const discId = frente.disciplina_id;
        const discNome =
          getDisciplinaNome(frente.disciplinas) || "Desconhecida";
        const key = `${discId}_${frente.curso_id || "sem-curso"}`;

        if (!frentesPorDisciplinaECurso.has(key)) {
          frentesPorDisciplinaECurso.set(key, {
            disciplina: discNome,
            frentes: [],
          });
        }
        frentesPorDisciplinaECurso.get(key)!.frentes.push({
          id: frente.id,
          nome: frente.nome,
          curso_id: frente.curso_id,
        });
      });

      console.log(
        "[CronogramaService] Frentes agrupadas por disciplina e curso:",
        Array.from(frentesPorDisciplinaECurso.entries()).map(([key, info]) => ({
          disciplina: info.disciplina,
          curso_id:
            key.split("_")[1] === "sem-curso" ? null : key.split("_")[1],
          total_frentes: info.frentes.length,
          frentes: info.frentes.map((f: FrenteInfo) => f.nome),
        })),
      );

      // Verificar frentes do curso selecionado
      if (cursoId) {
        const frentesDoCurso =
          todasFrentesSemFiltro?.filter(
            (f: FrenteValidacaoResult) => f.curso_id === cursoId,
          ) || [];
        console.log("[CronogramaService] Frentes do curso selecionado:", {
          curso_id: cursoId,
          total: frentesDoCurso.length,
          frentes: frentesDoCurso.map((f: FrenteValidacaoResult) => ({
            id: f.id,
            nome: f.nome,
            disciplina: getDisciplinaNome(f.disciplinas),
          })),
        });

        // Verificar se há frentes sem curso_id
        const frentesSemCurso =
          todasFrentesSemFiltro?.filter(
            (f: FrenteValidacaoResult) => !f.curso_id,
          ) || [];
        if (frentesSemCurso.length > 0) {
          console.warn(
            "[CronogramaService] ⚠️ Frentes SEM curso_id encontradas:",
            frentesSemCurso.map((f: FrenteValidacaoResult) => ({
              id: f.id,
              nome: f.nome,
              disciplina: getDisciplinaNome(f.disciplinas),
            })),
          );
        }
      }
    }

    // AGORA: Buscar frentes com filtro de curso (query real)
    let frentesQuery = client
      .from("frentes")
      .select("id, nome, disciplina_id, curso_id, disciplinas(nome)")
      .in("disciplina_id", disciplinasIds);

    if (cursoId) {
      frentesQuery = frentesQuery.eq("curso_id", cursoId);
    }

    const { data: frentesData, error: frentesError } = await frentesQuery;

    if (frentesError) {
      console.error(
        "[CronogramaService] Erro ao buscar frentes:",
        frentesError,
      );
      throw new CronogramaValidationError(
        `Erro ao buscar frentes: ${frentesError.message}`,
      );
    }

    console.log("🔍 [CronogramaService] RESULTADO DA BUSCA DE FRENTES:", {
      total_encontradas: frentesData?.length || 0,
      frentes: frentesData?.map((f: FrenteValidacaoResult) => ({
        id: f.id,
        nome: f.nome,
        disciplina_id: f.disciplina_id,
        curso_id: f.curso_id,
        disciplina_nome: Array.isArray(f.disciplinas)
          ? f.disciplinas[0]?.nome
          : f.disciplinas?.nome,
      })),
    });

    const frenteIds = frentesData?.map((f) => f.id) || [];
    const frentesPorDisciplina = new Map<string, string[]>();

    // Agrupar frentes por disciplina para validação
    frentesData?.forEach((frente: FrenteValidacaoResult) => {
      const discId = frente.disciplina_id;
      if (discId && !frentesPorDisciplina.has(discId)) {
        frentesPorDisciplina.set(discId, []);
      }
      if (discId) {
        frentesPorDisciplina.get(discId)!.push(frente.nome);
      }
    });

    console.log(
      "[CronogramaService] Frentes encontradas por disciplina (COM filtro):",
      Array.from(frentesPorDisciplina.entries()).map(([discId, nomes]) => {
        const primeiraFrente = frentesData?.find(
          (f: FrenteValidacaoResult) => f.disciplina_id === discId,
        );
        const disciplinaNome =
          getDisciplinaNome(primeiraFrente?.disciplinas) || "Desconhecida";
        return {
          disciplina_id: discId,
          disciplina_nome: disciplinaNome,
          frentes: nomes,
          total: nomes.length,
        };
      }),
    );

    // Validação crítica: verificar se todas as disciplinas têm frentes
    disciplinasIds.forEach((discId) => {
      const frentesDaDisciplina = frentesPorDisciplina.get(discId) || [];
      if (frentesDaDisciplina.length === 0) {
        console.error(
          `[CronogramaService] ❌❌❌ DISCIPLINA ${discId} NÃO TEM FRENTES ENCONTRADAS!`,
        );
      } else {
        console.log(
          `[CronogramaService] ✅ Disciplina ${discId} tem ${frentesDaDisciplina.length} frente(s):`,
          frentesDaDisciplina,
        );
      }
    });

    console.log(
      "[CronogramaService] Total de frentes encontradas:",
      frenteIds.length,
    );
    console.log(
      "[CronogramaService] ===========================================",
    );

    if (frenteIds.length === 0) {
      throw new CronogramaValidationError(
        "Nenhuma frente encontrada para as disciplinas selecionadas",
      );
    }

    // Buscar módulos das frentes (com informações da frente para validação)
    console.log(
      "[CronogramaService] ========== DIAGNÓSTICO DE MÓDULOS ==========",
    );
    console.log("[CronogramaService] Buscando módulos para:", {
      total_frentes: frenteIds.length,
      frente_ids: frenteIds,
      curso_id: cursoId,
    });

    // PRIMEIRO: Buscar TODOS os módulos das frentes (sem filtro de curso) para diagnóstico
    const { data: todosModulosSemFiltro, error: todosModulosError } =
      await client
        .from("modulos")
        .select(
          "id, nome, frente_id, curso_id, frentes(id, nome, disciplina_id, curso_id, disciplinas(nome))",
        )
        .in("frente_id", frenteIds);

    if (todosModulosError) {
      console.error(
        "[CronogramaService] Erro ao buscar todos os módulos (diagnóstico):",
        todosModulosError,
      );
    } else {
      console.log(
        "[CronogramaService] TOTAL de módulos encontrados (SEM filtro de curso):",
        todosModulosSemFiltro?.length || 0,
      );

      // Agrupar módulos por frente
      const modulosPorFrenteSemFiltro = new Map<string, DiagnosticoFrente>();
      todosModulosSemFiltro?.forEach((modulo: ModuloQueryResult) => {
        const frenteId = modulo.frente_id || "";
        if (!modulosPorFrenteSemFiltro.has(frenteId)) {
          const frente = getFrenteInfo(modulo.frentes);
          modulosPorFrenteSemFiltro.set(frenteId, {
            frente: {
              id: frente?.id,
              nome: frente?.nome,
              disciplina: getDisciplinaNome(frente?.disciplinas),
              curso_id: frente?.curso_id,
            },
            modulos: [],
          });
        }
        modulosPorFrenteSemFiltro.get(frenteId)!.modulos.push({
          id: modulo.id,
          nome: modulo.nome || "",
          curso_id: modulo.curso_id ?? null,
        });
      });

      console.log(
        "[CronogramaService] Módulos agrupados por frente (SEM filtro):",
        Array.from(modulosPorFrenteSemFiltro.entries()).map(
          ([frenteId, info]) => ({
            frente_id: frenteId,
            frente_nome: info.frente.nome,
            disciplina: info.frente.disciplina,
            frente_curso_id: info.frente.curso_id,
            total_modulos: info.modulos.length,
            modulos: info.modulos.map((m: ModuloInfo) => ({
              id: m.id,
              nome: m.nome,
              curso_id: m.curso_id,
            })),
          }),
        ),
      );

      // Verificar módulos do curso selecionado
      if (cursoId) {
        const modulosDoCurso =
          todosModulosSemFiltro?.filter(
            (m: ModuloQueryResult) => m.curso_id === cursoId,
          ) || [];
        console.log("[CronogramaService] Módulos do curso selecionado:", {
          curso_id: cursoId,
          total: modulosDoCurso.length,
        });

        // Verificar frentes sem módulos no curso
        frenteIds.forEach((frenteId) => {
          const frente = frentesData?.find(
            (f: FrenteValidacaoResult) => f.id === frenteId,
          );
          const modulosDaFrente =
            todosModulosSemFiltro?.filter(
              (m: ModuloQueryResult) =>
                m.frente_id === frenteId && m.curso_id === cursoId,
            ) || [];

          if (modulosDaFrente.length === 0) {
            console.error(
              `[CronogramaService] ❌❌❌ FRENTE "${frente?.nome}" (${frenteId}) NÃO TEM MÓDULOS NO CURSO ${cursoId}!`,
            );
          } else {
            console.log(
              `[CronogramaService] ✅ Frente "${frente?.nome}" tem ${modulosDaFrente.length} módulo(s) no curso`,
            );
          }
        });
      }
    }

    // AGORA: Buscar módulos com filtro de curso (query real)
    let modulosQuery = client
      .from("modulos")
      .select(
        "id, frente_id, curso_id, frentes(nome, disciplina_id, curso_id, disciplinas(nome))",
      )
      .in("frente_id", frenteIds);

    // Alguns módulos antigos podem não ter curso_id definido.
    // Quando um curso é informado, aceitamos módulos que pertençam às frentes do curso
    // mesmo se o curso_id estiver null, para manter compatibilidade com dados legados.
    if (cursoId) {
      modulosQuery = modulosQuery.or(`curso_id.eq.${cursoId},curso_id.is.null`);
    }

    const { data: modulosData, error: modulosError } = await modulosQuery;

    if (modulosError) {
      console.error(
        "[CronogramaService] Erro ao buscar módulos:",
        modulosError,
      );
      throw new CronogramaValidationError(
        `Erro ao buscar módulos: ${modulosError.message}`,
      );
    }

    console.log("🔍 [CronogramaService] RESULTADO DA BUSCA DE MÓDULOS:", {
      total_encontrados: modulosData?.length || 0,
      frentes_com_modulos: new Set(
        modulosData?.map((m: ModuloQueryResult) => m.frente_id || "") || [],
      ).size,
      total_frentes_esperadas: frenteIds.length,
      modulos_por_frente: modulosData?.reduce(
        (acc: Record<string, number>, m: ModuloQueryResult) => {
          const frenteId = m.frente_id || "";
          if (!acc[frenteId]) {
            acc[frenteId] = 0;
          }
          acc[frenteId]++;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });

    // Verificar quais frentes NÃO têm módulos
    const frentesComModulos = new Set(
      modulosData?.map((m: ModuloQueryResult) => m.frente_id || "") || [],
    );
    const frentesSemModulos = frenteIds.filter(
      (id) => !frentesComModulos.has(id),
    );
    if (frentesSemModulos.length > 0) {
      console.error(
        "🔍 [CronogramaService] ❌❌❌ FRENTES SEM MÓDULOS ENCONTRADAS:",
        frentesSemModulos.map((id) => {
          const frente = frentesData?.find(
            (f: FrenteValidacaoResult) => f.id === id,
          );
          return {
            frente_id: id,
            frente_nome: frente?.nome || "Desconhecida",
            disciplina_id: frente?.disciplina_id,
          };
        }),
      );
    }

    let moduloIds = modulosData?.map((m) => m.id) || [];
    const modulosPorFrente = new Map<string, string[]>();

    // Agrupar módulos por frente para validação
    modulosData?.forEach((modulo: ModuloQueryResult) => {
      const frenteId = modulo.frente_id || "";
      if (!modulosPorFrente.has(frenteId)) {
        modulosPorFrente.set(frenteId, []);
      }
      modulosPorFrente.get(frenteId)!.push(modulo.id);
    });

    console.log(
      "[CronogramaService] Módulos encontrados por frente (COM filtro):",
      Array.from(modulosPorFrente.entries()).map(([frenteId, moduloIds]) => {
        const frente = frentesData?.find(
          (f: FrenteValidacaoResult) => f.id === frenteId,
        );
        const moduloComFrente = modulosData?.find(
          (m: ModuloQueryResult) => m.frente_id === frenteId,
        );
        const frenteInfo = getFrenteInfo(moduloComFrente?.frentes);
        const disciplinaNome =
          getDisciplinaNome(frenteInfo?.disciplinas) || "Desconhecida";
        return {
          frente_id: frenteId,
          frente_nome: frente?.nome || frenteInfo?.nome || "Desconhecida",
          disciplina: disciplinaNome,
          total_modulos: moduloIds.length,
          modulo_ids: moduloIds,
        };
      }),
    );

    // Validação crítica: verificar se todas as frentes têm módulos
    frenteIds.forEach((frenteId) => {
      const modulosDaFrente = modulosPorFrente.get(frenteId) || [];
      const frente = frentesData?.find(
        (f: FrenteValidacaoResult) => f.id === frenteId,
      );
      if (modulosDaFrente.length === 0) {
        console.error(
          `[CronogramaService] ❌❌❌ FRENTE "${frente?.nome}" (${frenteId}) NÃO TEM MÓDULOS!`,
        );
      } else {
        console.log(
          `[CronogramaService] ✅ Frente "${frente?.nome}" tem ${modulosDaFrente.length} módulo(s)`,
        );
      }
    });

    console.log(
      "[CronogramaService] Total de módulos encontrados:",
      moduloIds.length,
    );
    console.log(
      "[CronogramaService] ===========================================",
    );

    if (modulosSelecionados && modulosSelecionados.length > 0) {
      const modulosAntesFiltro = moduloIds.length;

      // Log detalhado dos módulos antes do filtro
      const modulosPorFrenteAntes = new Map<
        string,
        { total: number; ids: string[] }
      >();
      modulosData?.forEach((modulo: ModuloQueryResult) => {
        const frenteId = modulo.frente_id || "";
        if (!modulosPorFrenteAntes.has(frenteId)) {
          modulosPorFrenteAntes.set(frenteId, { total: 0, ids: [] });
        }
        const frente = modulosPorFrenteAntes.get(frenteId)!;
        frente.total++;
        frente.ids.push(modulo.id);
      });

      console.log(
        "[CronogramaService] Módulos ANTES do filtro por frente:",
        Array.from(modulosPorFrenteAntes.entries()).map(([frenteId, info]) => {
          const frente = frentesData?.find(
            (f: FrenteValidacaoResult) => f.id === frenteId,
          );
          return {
            frente_id: frenteId,
            frente_nome: frente?.nome || "Desconhecida",
            total_modulos: info.total,
            modulo_ids: info.ids,
          };
        }),
      );

      moduloIds = moduloIds.filter((id) => modulosSelecionados.includes(id));

      console.log("[CronogramaService] Filtro de módulos aplicado:", {
        modulos_antes: modulosAntesFiltro,
        modulos_depois: moduloIds.length,
        modulos_selecionados_total: modulosSelecionados.length,
        modulos_selecionados_primeiros_10: modulosSelecionados.slice(0, 10),
      });

      // Validar que todas as frentes têm pelo menos um módulo selecionado
      const frentesComModulosSelecionados = new Set<string>();
      const modulosPorFrenteDepois = new Map<
        string,
        { total: number; ids: string[] }
      >();

      modulosData?.forEach((modulo: ModuloQueryResult) => {
        if (moduloIds.includes(modulo.id)) {
          const frenteId = modulo.frente_id || "";
          frentesComModulosSelecionados.add(frenteId);
          if (!modulosPorFrenteDepois.has(frenteId)) {
            modulosPorFrenteDepois.set(frenteId, { total: 0, ids: [] });
          }
          const frente = modulosPorFrenteDepois.get(frenteId)!;
          frente.total++;
          frente.ids.push(modulo.id);
        }
      });

      console.log(
        "[CronogramaService] Módulos DEPOIS do filtro por frente:",
        Array.from(modulosPorFrenteDepois.entries()).map(([frenteId, info]) => {
          const frente = frentesData?.find(
            (f: FrenteValidacaoResult) => f.id === frenteId,
          );
          return {
            frente_id: frenteId,
            frente_nome: frente?.nome || "Desconhecida",
            total_modulos: info.total,
            modulo_ids: info.ids,
          };
        }),
      );

      // Verificar se há módulos selecionados que não pertencem a nenhuma frente encontrada
      const modulosSelecionadosValidos = new Set(moduloIds);
      const modulosSelecionadosInvalidos = modulosSelecionados.filter(
        (id) => !modulosSelecionadosValidos.has(id),
      );
      if (modulosSelecionadosInvalidos.length > 0) {
        console.warn(
          "[CronogramaService] ⚠️ Módulos selecionados que não pertencem às frentes encontradas:",
          {
            total_invalidos: modulosSelecionadosInvalidos.length,
            modulo_ids: modulosSelecionadosInvalidos.slice(0, 10),
          },
        );
      }

      const frentesSemModulos = frenteIds.filter(
        (id) => !frentesComModulosSelecionados.has(id),
      );
      if (frentesSemModulos.length > 0) {
        const frentesSemModulosNomes = frentesSemModulos.map((id) => {
          const frente = frentesData?.find(
            (f: FrenteValidacaoResult) => f.id === id,
          );
          return {
            frente_id: id,
            frente_nome: frente?.nome || "Desconhecida",
            disciplina_id: frente?.disciplina_id || "Desconhecida",
          };
        });
        console.warn(
          "[CronogramaService] ⚠️⚠️⚠️ Frentes sem módulos selecionados (CRÍTICO):",
          JSON.stringify(frentesSemModulosNomes, null, 2),
        );

        // Tentar identificar se há módulos dessas frentes que não foram selecionados
        frentesSemModulos.forEach((frenteId) => {
          const modulosDaFrente = modulosPorFrenteAntes.get(frenteId);
          if (modulosDaFrente && modulosDaFrente.ids.length > 0) {
            console.warn(
              `[CronogramaService] ⚠️ Frente ${frentesData?.find((f: FrenteValidacaoResult) => f.id === frenteId)?.nome} tem ${modulosDaFrente.ids.length} módulo(s) disponível(is) mas nenhum foi selecionado:`,
              modulosDaFrente.ids.slice(0, 5),
            );
          }
        });
      }

      if (moduloIds.length === 0) {
        console.warn(
          "[CronogramaService] Nenhum módulo selecionado permaneceu após o filtro por frentes/curso.",
        );
      }
    }

    // Diagnóstico adicional quando o usuário selecionou módulos mas nenhum foi considerado válido
    if (
      moduloIds.length === 0 &&
      modulosSelecionados &&
      modulosSelecionados.length > 0
    ) {
      const { data: modulosSelecionadosData, error: modulosSelecionadosError } =
        await client
          .from("modulos")
          .select(
            "id, frente_id, curso_id, frentes(id, nome, curso_id, disciplinas(nome))",
          )
          .in("id", modulosSelecionados);

      if (modulosSelecionadosError) {
        console.warn(
          "[CronogramaService] Não foi possível diagnosticar módulos selecionados:",
          modulosSelecionadosError,
        );
      } else {
        const frentesValidasSet = new Set(frenteIds);
        const modulosForaDasFrentes = (modulosSelecionadosData || []).filter(
          (m: ModuloSelecionadoQueryResult) =>
            m.frente_id && !frentesValidasSet.has(m.frente_id),
        );

        console.warn(
          "[CronogramaService] ⚠️ Módulos selecionados não pertencem às frentes/curso informados:",
          {
            cursoId,
            total_modulos_selecionados: modulosSelecionados.length,
            total_modulos_encontrados: modulosSelecionadosData?.length || 0,
            modulos_fora_das_frentes: modulosForaDasFrentes.map(
              (m: ModuloSelecionadoQueryResult) => {
                const frenteInfo = getFirst(m.frentes);
                return {
                  id: m.id,
                  frente_id: m.frente_id,
                  curso_id: m.curso_id,
                  frente_nome: frenteInfo?.nome,
                  frente_curso_id: frenteInfo?.curso_id,
                  disciplina_nome: getFirst(frenteInfo?.disciplinas)?.nome,
                };
              },
            ),
          },
        );
      }

      throw new CronogramaValidationError(
        "Nenhum módulo válido encontrado para o curso selecionado. Verifique se os módulos estão vinculados às frentes e disciplinas escolhidas.",
      );
    }

    if (moduloIds.length === 0) {
      throw new CronogramaValidationError(
        "Nenhum módulo encontrado para as frentes selecionadas",
      );
    }

    // PRIMEIRO: Buscar TODAS as aulas (sem filtro de prioridade) para diagnóstico
    console.log(
      "🔍 [CronogramaService] Buscando TODAS as aulas (sem filtro de prioridade) para diagnóstico...",
    );
    const { data: todasAulasSemFiltro, error: todasAulasError } = await client
      .from("aulas")
      .select(
        `
        id,
        nome,
        prioridade,
        modulo_id,
        modulos!inner(
          id,
          frente_id,
          frentes!inner(
            id,
            nome,
            curso_id
          )
        )
      `,
      )
      .in("modulo_id", moduloIds);

    if (!todasAulasError && todasAulasSemFiltro) {
      // Agrupar por frente
      const aulasPorFrente = new Map<
        string,
        {
          total: number;
          prioridade_0: number;
          prioridade_null: number;
          prioridade_menor_1: number;
          prioridade_maior_igual_1: number;
        }
      >();

      todasAulasSemFiltro.forEach((aula: AulaQueryResult) => {
        const modulo = getModuloInfo(aula.modulos);
        const frente = getFrenteInfo(modulo?.frentes);
        const frenteId = frente?.id;
        if (!frenteId) return;

        if (!aulasPorFrente.has(frenteId)) {
          aulasPorFrente.set(frenteId, {
            total: 0,
            prioridade_0: 0,
            prioridade_null: 0,
            prioridade_menor_1: 0,
            prioridade_maior_igual_1: 0,
          });
        }

        const stats = aulasPorFrente.get(frenteId)!;
        stats.total++;

        if (aula.prioridade === null || aula.prioridade === undefined) {
          stats.prioridade_null++;
        } else if (aula.prioridade === 0) {
          stats.prioridade_0++;
        } else if (aula.prioridade < 1) {
          stats.prioridade_menor_1++;
        } else if (aula.prioridade >= 1) {
          stats.prioridade_maior_igual_1++;
        }
      });

      console.log(
        "🔍 [CronogramaService] Diagnóstico de aulas por frente (ANTES do filtro de prioridade):",
        Array.from(aulasPorFrente.entries()).map(([frenteId, stats]) => {
          const frente = frentesData?.find(
            (f: FrenteQueryResult) => f.id === frenteId,
          );
          return {
            frente_id: frenteId,
            frente_nome: frente?.nome || "Desconhecida",
            total_aulas: stats.total,
            prioridade_0: stats.prioridade_0,
            prioridade_null: stats.prioridade_null,
            prioridade_menor_1: stats.prioridade_menor_1,
            prioridade_maior_igual_1: stats.prioridade_maior_igual_1,
            sera_incluida: stats.prioridade_maior_igual_1 > 0,
          };
        }),
      );
    }

    // Buscar aulas dos módulos com filtro de prioridade
    // Não usamos curso_id direto de aulas para evitar problemas de cache/sincronização
    // Filtramos via join com frentes após buscar
    const aulasQuery = client
      .from("aulas")
      .select(
        `
        id,
        nome,
        numero_aula,
        tempo_estimado_minutos,
        prioridade,
        modulos!inner(
          id,
          nome,
          numero_modulo,
          frentes!inner(
            id,
            nome,
            curso_id,
            disciplinas!inner(
              id,
              nome
            )
          )
        )
      `,
      )
      .in("modulo_id", moduloIds)
      .gte("prioridade", prioridadeMinimaEfetiva)
      .neq("prioridade", 0);

    const { data: aulasDataRaw, error: aulasError } = await aulasQuery;

    if (aulasError) {
      console.error("[CronogramaService] Erro ao buscar aulas:", {
        message: aulasError.message,
        details: aulasError.details,
        hint: aulasError.hint,
        code: aulasError.code,
      });

      // Se o erro for sobre curso_id não existir, tentar buscar sem selecionar curso_id
      if (aulasError.message?.includes("curso_id")) {
        console.warn(
          "[CronogramaService] Tentando buscar aulas sem filtro de curso_id...",
        );
        const { data: aulasDataSemFiltro, error: errorSemFiltro } = await client
          .from("aulas")
          .select(
            `
            id,
            nome,
            numero_aula,
            tempo_estimado_minutos,
            prioridade,
            modulos!inner(
              id,
              nome,
              numero_modulo,
              frentes!inner(
                id,
                nome,
                curso_id,
                disciplinas!inner(
                  id,
                  nome
                )
              )
            )
          `,
          )
          .in("modulo_id", moduloIds)
          .gte("prioridade", prioridadeMinimaEfetiva)
          .neq("prioridade", 0);

        if (errorSemFiltro) {
          throw new CronogramaValidationError(
            `Erro ao buscar aulas: ${errorSemFiltro.message}`,
          );
        }

        // Filtrar por curso_id em memória baseado na frente
        if (aulasDataSemFiltro) {
          const aulasFiltradas = aulasDataSemFiltro.filter(
            (aula: AulaQueryResult) => {
              const modulo = getModuloInfo(aula.modulos);
              const frente = getFrenteInfo(modulo?.frentes);
              return frente?.curso_id === cursoId;
            },
          );

          if (aulasFiltradas.length === 0) {
            throw new CronogramaValidationError(
              "Nenhuma aula encontrada com os critérios fornecidos",
            );
          }

          // Continuar com aulasFiltradas
          const aulas: AulaCompleta[] = aulasFiltradas.map(
            (aula: AulaQueryResult) => {
              const modulo = getModuloInfo(aula.modulos);
              const frente = getFrenteInfo(modulo?.frentes);
              const disciplina = getFirst(frente?.disciplinas);
              return {
                id: aula.id,
                nome: aula.nome,
                numero_aula: aula.numero_aula ?? null,
                tempo_estimado_minutos:
                  aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS,
                prioridade: aula.prioridade ?? 1,
                modulo_id: modulo?.id || "",
                modulo_nome: modulo?.nome || "",
                numero_modulo: modulo?.numero_modulo ?? null,
                frente_id: frente?.id || "",
                frente_nome: frente?.nome || "",
                disciplina_id: disciplina?.id || "",
                disciplina_nome: disciplina?.nome || "",
              };
            },
          );

          return aulas;
        }
      }

      console.error("[CronogramaService] Erro ao buscar aulas:", {
        message: aulasError.message,
        details: aulasError.details,
        hint: aulasError.hint,
        code: aulasError.code,
      });
      throw new CronogramaValidationError(
        `Erro ao buscar aulas: ${aulasError.message}`,
      );
    }

    if (!aulasDataRaw || aulasDataRaw.length === 0) {
      throw new CronogramaValidationError(
        "Nenhuma aula encontrada com os critérios fornecidos",
      );
    }

    console.log(
      "🔍 [CronogramaService] Aulas encontradas ANTES do filtro de curso:",
      {
        total: aulasDataRaw.length,
        por_frente: aulasDataRaw.reduce(
          (acc: FrenteStatsAccumulator, aula: AulaQueryResult) => {
            const modulo = getModuloInfo(aula.modulos);
            const frente = getFrenteInfo(modulo?.frentes);
            const frenteId = frente?.id || "";
            const frenteNome = frente?.nome || "";
            if (!acc[frenteId]) {
              acc[frenteId] = {
                frente_nome: frenteNome,
                total: 0,
                curso_ids: new Set(),
              };
            }
            acc[frenteId].total++;
            if (frente?.curso_id) {
              acc[frenteId].curso_ids.add(frente.curso_id);
            }
            return acc;
          },
          {} as FrenteStatsAccumulator,
        ),
      },
    );

    // Filtrar por curso_id usando o join com frentes (se fornecido)
    let aulasData = aulasDataRaw;
    if (cursoId) {
      const aulasAntesFiltro = aulasDataRaw.length;
      aulasData = aulasDataRaw.filter((aula: AulaQueryResult) => {
        const modulo = getModuloInfo(aula.modulos);
        const frente = getFrenteInfo(modulo?.frentes);
        return frente?.curso_id === cursoId;
      });

      console.log("🔍 [CronogramaService] Filtro de curso aplicado:", {
        curso_id: cursoId,
        aulas_antes: aulasAntesFiltro,
        aulas_depois: aulasData.length,
        aulas_removidas: aulasAntesFiltro - aulasData.length,
        por_frente: aulasData.reduce(
          (acc: FrenteCountAccumulator, aula: AulaQueryResult) => {
            const modulo = getModuloInfo(aula.modulos);
            const frente = getFrenteInfo(modulo?.frentes);
            const frenteId = frente?.id || "";
            const frenteNome = frente?.nome || "";
            if (!acc[frenteId]) {
              acc[frenteId] = { frente_nome: frenteNome, total: 0 };
            }
            acc[frenteId].total++;
            return acc;
          },
          {} as FrenteCountAccumulator,
        ),
      });

      if (aulasData.length === 0) {
        // Log detalhado antes de lançar erro
        const frentesComCursoDiferente = aulasDataRaw.reduce(
          (acc: FrenteComCursoDiferenteAccumulator, aula: AulaQueryResult) => {
            const modulo = getModuloInfo(aula.modulos);
            const frente = getFrenteInfo(modulo?.frentes);
            const frenteId = frente?.id ?? "";
            const frenteNome = frente?.nome ?? "Desconhecida";
            const frenteCursoId = frente?.curso_id ?? null;
            if (!acc[frenteId]) {
              acc[frenteId] = {
                frente_nome: frenteNome,
                curso_id: frenteCursoId,
                total: 0,
              };
            }
            acc[frenteId].total++;
            return acc;
          },
          {} as FrenteComCursoDiferenteAccumulator,
        );

        interface FrenteInfo {
          frente_nome: string;
          curso_id: string | null;
          total: number;
        }

        console.error(
          "🔍 [CronogramaService] ❌❌❌ Nenhuma aula encontrada após filtro de curso:",
          {
            curso_id_esperado: cursoId,
            frentes_encontradas: Object.values(frentesComCursoDiferente).map(
              (f: FrenteInfo) => ({
                frente_nome: f.frente_nome,
                curso_id: f.curso_id,
                total_aulas: f.total,
                curso_id_correto: f.curso_id === cursoId,
              }),
            ),
          },
        );

        throw new CronogramaValidationError(
          "Nenhuma aula encontrada para o curso selecionado",
        );
      }
    }

    // Mapear dados para estrutura mais simples
    const aulas: AulaCompleta[] = aulasData.map((aula: AulaQueryResult) => {
      const modulo = getModuloInfo(aula.modulos);
      const frente = getFrenteInfo(modulo?.frentes);
      const disciplina = getFirst(frente?.disciplinas);

      return {
        id: aula.id,
        nome: aula.nome,
        numero_aula: aula.numero_aula ?? null,
        tempo_estimado_minutos: aula.tempo_estimado_minutos ?? null,
        prioridade: aula.prioridade ?? 0,
        modulo_id: modulo?.id ?? "",
        modulo_nome: modulo?.nome ?? "",
        numero_modulo: modulo?.numero_modulo ?? null,
        frente_id: frente?.id ?? "",
        frente_nome: frente?.nome ?? "",
        disciplina_id: disciplina?.id ?? "",
        disciplina_nome: disciplina?.nome ?? "",
      };
    });

    // Validar que todas as frentes selecionadas têm aulas
    const frentesComAulas = new Set<string>();
    aulas.forEach((aula) => {
      frentesComAulas.add(aula.frente_id);
    });

    const frentesSemAulasInicial = frenteIds.filter(
      (id) => !frentesComAulas.has(id),
    );
    if (frentesSemAulasInicial.length > 0) {
      const frentesSemAulasNomes = frentesSemAulasInicial.map((id) => {
        const frente = frentesData?.find((f: FrenteQueryResult) => f.id === id);
        return frente?.nome || id;
      });
      console.warn(
        "[CronogramaService] ⚠️ Frentes sem aulas encontradas (após filtros):",
        {
          frentes: frentesSemAulasNomes,
          motivo_possivel:
            "Nenhuma aula encontrada com prioridade >= " +
            prioridadeMinimaEfetiva +
            " ou módulos não selecionados",
        },
      );

      // Verificar se há módulos selecionados para essas frentes
      if (modulosSelecionados && modulosSelecionados.length > 0) {
        frentesSemAulasInicial.forEach((frenteId) => {
          const modulosDaFrente = modulosPorFrente.get(frenteId) || [];
          const modulosSelecionadosDaFrente = modulosDaFrente.filter((id) =>
            modulosSelecionados.includes(id),
          );
          if (modulosSelecionadosDaFrente.length > 0) {
            console.warn(
              `[CronogramaService] ⚠️ Frente ${frentesData?.find((f: FrenteQueryResult) => f.id === frenteId)?.nome} tem ${modulosSelecionadosDaFrente.length} módulo(s) selecionado(s) mas nenhuma aula foi encontrada`,
            );
          }
        });
      }
    }

    // Agrupar aulas por frente e disciplina para log
    const aulasPorFrente = new Map<
      string,
      { frente_nome: string; disciplina_nome: string; total: number }
    >();
    aulas.forEach((aula) => {
      if (!aulasPorFrente.has(aula.frente_id)) {
        aulasPorFrente.set(aula.frente_id, {
          frente_nome: aula.frente_nome,
          disciplina_nome: aula.disciplina_nome,
          total: 0,
        });
      }
      aulasPorFrente.get(aula.frente_id)!.total++;
    });

    console.log(
      "[CronogramaService] Aulas encontradas por frente:",
      Array.from(aulasPorFrente.entries()).map(([frenteId, info]) => ({
        frente_id: frenteId,
        frente_nome: info.frente_nome,
        disciplina_nome: info.disciplina_nome,
        total_aulas: info.total,
      })),
    );

    // Ordenar aulas: Disciplina > Frente > Numero Modulo > Numero Aula
    aulas.sort((a, b) => {
      // Ordenar por disciplina
      if (a.disciplina_nome !== b.disciplina_nome) {
        return a.disciplina_nome.localeCompare(b.disciplina_nome);
      }
      // Ordenar por frente
      if (a.frente_nome !== b.frente_nome) {
        return a.frente_nome.localeCompare(b.frente_nome);
      }
      // Ordenar por número do módulo
      const numModA = a.numero_modulo ?? 0;
      const numModB = b.numero_modulo ?? 0;
      if (numModA !== numModB) {
        return numModA - numModB;
      }
      // Ordenar por número da aula
      const numAulaA = a.numero_aula ?? 0;
      const numAulaB = b.numero_aula ?? 0;
      return numAulaA - numAulaB;
    });

    console.log("[CronogramaService] ========== RESUMO FINAL ==========");
    console.log(
      "[CronogramaService] Total de aulas encontradas:",
      aulas.length,
    );
    console.log(
      "[CronogramaService] Total de frentes com aulas:",
      frentesComAulas.size,
    );
    console.log(
      "[CronogramaService] Total de frentes esperadas:",
      frenteIds.length,
    );

    // Listar todas as frentes e se têm aulas
    const frentesComStatus = frenteIds.map((frenteId) => {
      const frente = frentesData?.find(
        (f: FrenteQueryResult) => f.id === frenteId,
      );
      const temAulas = frentesComAulas.has(frenteId);
      const totalAulas = aulas.filter((a) => a.frente_id === frenteId).length;
      return {
        frente_id: frenteId,
        frente_nome: frente?.nome || "Desconhecida",
        disciplina_id: frente?.disciplina_id || "Desconhecida",
        tem_aulas: temAulas,
        total_aulas: totalAulas,
      };
    });

    console.log(
      "[CronogramaService] Status de todas as frentes:",
      JSON.stringify(frentesComStatus, null, 2),
    );

    const frentesSemAulas = frentesComStatus.filter((f) => !f.tem_aulas);
    if (frentesSemAulas.length > 0) {
      console.error(
        "[CronogramaService] ❌❌❌ FRENTES SEM AULAS NO CRONOGRAMA:",
        JSON.stringify(frentesSemAulas, null, 2),
      );
    } else {
      console.log("[CronogramaService] ✅ Todas as frentes têm aulas!");
    }
    console.log("[CronogramaService] ====================================");

    return aulas;
  }

  private distribuirAulas(
    aulasComCusto: Array<AulaCompleta & { custo: number }>,
    semanas: SemanaInfo[],
    modalidade: "paralelo" | "sequencial",
    ordemFrentesPreferencia?: string[],
  ): ItemDistribuicao[] {
    const semanasUteis = semanas.filter((s) => !s.is_ferias);
    if (semanasUteis.length === 0) return [];

    console.log("[CronogramaService] Distribuindo aulas (novo algoritmo):", {
      totalAulas: aulasComCusto.length,
      totalSemanas: semanas.length,
      semanasUteis: semanasUteis.length,
      semanasFerias: semanas.filter((s) => s.is_ferias).length,
      modalidade,
    });

    if (modalidade === "paralelo") {
      return this.distribuirParaleloPorFrente(aulasComCusto, semanasUteis);
    }

    return this.distribuirSequencialPorDisciplina(
      aulasComCusto,
      semanasUteis,
      ordemFrentesPreferencia,
    );
  }

  private pickReviewAula(
    pool: Array<AulaCompleta & { custo: number }>,
    startIndex: number,
    remaining: number,
  ): { aula: AulaCompleta & { custo: number }; nextIndex: number } | null {
    if (!pool.length) return null;

    // Tentativa 1: rotação a partir do índice atual, mantendo “mais recentes”
    for (let i = 0; i < pool.length; i++) {
      const idx = (startIndex + i) % pool.length;
      const candidate = pool[idx];
      if (candidate.custo <= remaining) {
        return { aula: candidate, nextIndex: (idx + 1) % pool.length };
      }
    }

    // Tentativa 2: pegar a menor aula que cabe
    const sortedByCost = [...pool].sort((a, b) => a.custo - b.custo);
    const cheapestThatFits = sortedByCost.find((a) => a.custo <= remaining);
    if (!cheapestThatFits) return null;

    // Mantém o índice (não avança rotação) já que não achou nenhuma “na ordem”
    return { aula: cheapestThatFits, nextIndex: startIndex };
  }

  private distribuirParaleloPorFrente(
    aulasComCusto: Array<AulaCompleta & { custo: number }>,
    semanasUteis: SemanaInfo[],
  ): ItemDistribuicao[] {
    const N = semanasUteis.length;
    const REVIEW_POOL_SIZE = 5;

    type FrenteState = {
      frente_id: string;
      frente_nome: string;
      disciplina_id: string;
      disciplina_nome: string;
      aulas: Array<AulaCompleta & { custo: number }>;
      idx: number;
      totalCusto: number;
      quota: number;
      credit: number;
      reviewPool: Array<AulaCompleta & { custo: number }>;
      reviewIdx: number;
    };

    const byFrente = new Map<string, FrenteState>();
    for (const a of aulasComCusto) {
      if (!byFrente.has(a.frente_id)) {
        byFrente.set(a.frente_id, {
          frente_id: a.frente_id,
          frente_nome: a.frente_nome,
          disciplina_id: a.disciplina_id,
          disciplina_nome: a.disciplina_nome,
          aulas: [],
          idx: 0,
          totalCusto: 0,
          quota: 0,
          credit: 0,
          reviewPool: [],
          reviewIdx: 0,
        });
      }
      const st = byFrente.get(a.frente_id)!;
      st.aulas.push(a);
      st.totalCusto += a.custo;
    }

    const frentes = Array.from(byFrente.values()).sort((a, b) => {
      const d = a.disciplina_nome.localeCompare(b.disciplina_nome);
      if (d !== 0) return d;
      return a.frente_nome.localeCompare(b.frente_nome);
    });

    frentes.forEach((f) => {
      f.quota = f.totalCusto / N;
      const pool = f.aulas.slice(-Math.min(REVIEW_POOL_SIZE, f.aulas.length));
      f.reviewPool = pool;
      f.reviewIdx = 0;
    });

    const itens: ItemDistribuicao[] = [];

    for (const semana of semanasUteis) {
      const capacidadeSemanal = semana.capacidade_minutos;
      let remaining = capacidadeSemanal;
      let ordemNaSemana = 1;

      // Atualizar créditos semanais
      frentes.forEach((f) => {
        f.credit += f.quota;
      });

      // 1) Garantia: 1 item por frente por semana (aula ou revisão)
      for (const f of frentes) {
        const nextAula = f.idx < f.aulas.length ? f.aulas[f.idx] : null;

        let chosen: AulaCompleta & { custo: number } | null = null;
        let isTeaching = false;

        if (nextAula && nextAula.custo <= remaining) {
          chosen = nextAula;
          isTeaching = true;
        } else {
          const reviewPick = this.pickReviewAula(
            f.reviewPool,
            f.reviewIdx,
            remaining,
          );
          if (reviewPick) {
            chosen = reviewPick.aula;
            f.reviewIdx = reviewPick.nextIndex;
          }
        }

        if (!chosen) {
          // Deveria ter sido barrado por validarViabilidadeSemanal
          throw new Error(
            `Falha ao garantir presença semanal da frente ${f.frente_nome}: nenhum item cabe na semana`,
          );
        }

        itens.push({
          cronograma_id: "",
          aula_id: chosen.id,
          semana_numero: semana.numero,
          ordem_na_semana: ordemNaSemana++,
        });
        remaining -= chosen.custo;
        f.credit -= chosen.custo;
        if (isTeaching) f.idx++;
      }

      // 2) Preenchimento por crédito (mantém “terminar junto”)
      let progressed = true;
      while (progressed && remaining > 0) {
        progressed = false;
        for (const f of frentes) {
          const nextAula = f.idx < f.aulas.length ? f.aulas[f.idx] : null;
          if (!nextAula) continue;
          if (nextAula.custo > remaining) continue;
          if (f.credit < nextAula.custo) continue;

          itens.push({
            cronograma_id: "",
            aula_id: nextAula.id,
            semana_numero: semana.numero,
            ordem_na_semana: ordemNaSemana++,
          });
          remaining -= nextAula.custo;
          f.credit -= nextAula.custo;
          f.idx++;
          progressed = true;
          if (remaining <= 0) break;
        }
      }
    }

    return itens;
  }

  private distribuirSequencialPorDisciplina(
    aulasComCusto: Array<AulaCompleta & { custo: number }>,
    semanasUteis: SemanaInfo[],
    ordemFrentesPreferencia?: string[],
  ): ItemDistribuicao[] {
    const N = semanasUteis.length;
    const REVIEW_POOL_SIZE = 5;

    type FrenteDentroDisciplina = {
      frente_id: string;
      frente_nome: string;
      aulas: Array<AulaCompleta & { custo: number }>;
      idx: number;
      reviewPool: Array<AulaCompleta & { custo: number }>;
      reviewIdx: number;
    };

    type DisciplinaState = {
      disciplina_id: string;
      disciplina_nome: string;
      frentes: FrenteDentroDisciplina[];
      currentFrontIdx: number;
      totalCusto: number;
      quota: number;
      credit: number;
      // Pool de revisão “global” da disciplina (usado quando a disciplina já acabou)
      reviewPool: Array<AulaCompleta & { custo: number }>;
      reviewIdx: number;
    };

    const byDisciplina = new Map<string, DisciplinaState>();
    for (const a of aulasComCusto) {
      if (!byDisciplina.has(a.disciplina_id)) {
        byDisciplina.set(a.disciplina_id, {
          disciplina_id: a.disciplina_id,
          disciplina_nome: a.disciplina_nome,
          frentes: [],
          currentFrontIdx: 0,
          totalCusto: 0,
          quota: 0,
          credit: 0,
          reviewPool: [],
          reviewIdx: 0,
        });
      }
      const d = byDisciplina.get(a.disciplina_id)!;
      d.totalCusto += a.custo;

      let frente = d.frentes.find((f) => f.frente_id === a.frente_id);
      if (!frente) {
        frente = {
          frente_id: a.frente_id,
          frente_nome: a.frente_nome,
          aulas: [],
          idx: 0,
          reviewPool: [],
          reviewIdx: 0,
        };
        d.frentes.push(frente);
      }
      frente.aulas.push(a);
    }

    const disciplinas = Array.from(byDisciplina.values()).sort((a, b) =>
      a.disciplina_nome.localeCompare(b.disciplina_nome),
    );

    // Ordenação opcional das frentes dentro de cada disciplina
    disciplinas.forEach((d) => {
      if (ordemFrentesPreferencia?.length) {
        const ordemMap = new Map(
          ordemFrentesPreferencia.map((nome, idx) => [nome, idx]),
        );
        d.frentes.sort((a, b) => {
          const oa = ordemMap.get(a.frente_nome) ?? Infinity;
          const ob = ordemMap.get(b.frente_nome) ?? Infinity;
          return oa - ob;
        });
      } else {
        d.frentes.sort((a, b) => a.frente_nome.localeCompare(b.frente_nome));
      }

      d.quota = d.totalCusto / N;
      // Pool de revisão por frente (para manter “1 frente por disciplina por semana”)
      d.frentes.forEach((f) => {
        f.reviewPool = f.aulas.slice(-Math.min(REVIEW_POOL_SIZE, f.aulas.length));
        f.reviewIdx = 0;
      });

      // Pool de revisão da disciplina (apenas quando a disciplina já terminou todas as frentes)
      const allAulas = d.frentes.flatMap((f) => f.aulas);
      d.reviewPool = allAulas.slice(
        -Math.min(REVIEW_POOL_SIZE, allAulas.length),
      );
      d.reviewIdx = 0;
    });

    const itens: ItemDistribuicao[] = [];

    for (const semana of semanasUteis) {
      const capacidadeSemanal = semana.capacidade_minutos;
      let remaining = capacidadeSemanal;
      let ordemNaSemana = 1;

      // Atualizar créditos semanais por disciplina
      disciplinas.forEach((d) => {
        d.credit += d.quota;
      });

      // 1) Garantia: 1 item por disciplina por semana (somente 1 frente por disciplina)
      for (const d of disciplinas) {
        // avançar frentes concluídas (para a próxima semana)
        while (
          d.currentFrontIdx < d.frentes.length &&
          d.frentes[d.currentFrontIdx].idx >= d.frentes[d.currentFrontIdx].aulas.length
        ) {
          d.currentFrontIdx++;
        }

        const currentFront =
          d.currentFrontIdx < d.frentes.length ? d.frentes[d.currentFrontIdx] : null;
        const nextAula =
          currentFront && currentFront.idx < currentFront.aulas.length
            ? currentFront.aulas[currentFront.idx]
            : null;

        let chosen: AulaCompleta & { custo: number } | null = null;
        let isTeaching = false;

        if (nextAula && nextAula.custo <= remaining) {
          chosen = nextAula;
          isTeaching = true;
        } else {
          // Se ainda existe uma frente “ativa” para a disciplina, a revisão deve vir dessa frente
          // para manter a regra “1 frente por disciplina por semana”.
          if (currentFront) {
            const reviewPick = this.pickReviewAula(
              currentFront.reviewPool,
              currentFront.reviewIdx,
              remaining,
            );
            if (reviewPick) {
              chosen = reviewPick.aula;
              currentFront.reviewIdx = reviewPick.nextIndex;
            }
          } else {
            const reviewPick = this.pickReviewAula(
              d.reviewPool,
              d.reviewIdx,
              remaining,
            );
            if (reviewPick) {
              chosen = reviewPick.aula;
              d.reviewIdx = reviewPick.nextIndex;
            }
          }
        }

        if (!chosen) {
          throw new Error(
            `Falha ao garantir presença semanal da disciplina ${d.disciplina_nome}: nenhum item cabe na semana`,
          );
        }

        itens.push({
          cronograma_id: "",
          aula_id: chosen.id,
          semana_numero: semana.numero,
          ordem_na_semana: ordemNaSemana++,
        });
        remaining -= chosen.custo;
        d.credit -= chosen.custo;
        if (isTeaching && currentFront) {
          currentFront.idx++;
        }
      }

      // 2) Preenchimento por crédito (sem trocar de frente na mesma semana)
      let progressed = true;
      while (progressed && remaining > 0) {
        progressed = false;
        for (const d of disciplinas) {
          if (d.currentFrontIdx >= d.frentes.length) continue;
          const currentFront = d.frentes[d.currentFrontIdx];
          const nextAula =
            currentFront.idx < currentFront.aulas.length
              ? currentFront.aulas[currentFront.idx]
              : null;
          if (!nextAula) continue;
          if (nextAula.custo > remaining) continue;
          if (d.credit < nextAula.custo) continue;

          itens.push({
            cronograma_id: "",
            aula_id: nextAula.id,
            semana_numero: semana.numero,
            ordem_na_semana: ordemNaSemana++,
          });
          remaining -= nextAula.custo;
          d.credit -= nextAula.custo;
          currentFront.idx++;
          progressed = true;
          if (remaining <= 0) break;

          // Se a frente acabou, não avançar para a próxima nesta semana
          if (currentFront.idx >= currentFront.aulas.length) {
            continue;
          }
        }
      }
    }

    return itens;
  }

  private async buscarAulasConcluidas(
    client: ReturnType<typeof getDatabaseClient>,
    alunoId: string,
    cursoId?: string,
  ): Promise<Set<string>> {
    if (!cursoId) {
      return new Set();
    }

    const { data, error } = await client
      .from("aulas_concluidas")
      .select("aula_id")
      .eq("aluno_id", alunoId)
      .eq("curso_id", cursoId);

    if (error) {
      console.error(
        "[CronogramaService] Erro ao buscar aulas concluídas:",
        error,
      );
    } else if (data && data.length > 0) {
      return new Set(data.map((row) => row.aula_id as string));
    }

    const { data: historicoData, error: historicoError } = await client
      .from("cronograma_itens")
      .select("aula_id, cronogramas!inner(aluno_id, curso_alvo_id)")
      .eq("concluido", true)
      .eq("cronogramas.aluno_id", alunoId)
      .eq("cronogramas.curso_alvo_id", cursoId);

    if (historicoError) {
      console.error(
        "[CronogramaService] Erro ao buscar histórico de aulas concluídas:",
        historicoError,
      );
      return new Set();
    }

    return new Set((historicoData ?? []).map((row) => row.aula_id as string));
  }

  private async persistirCronograma(
    client: ReturnType<typeof getDatabaseClient>,
    input: GerarCronogramaInput,
    itens: ItemDistribuicao[],
    empresaId: string,
  ): Promise<CronogramaDetalhado> {
    let cronograma: CronogramaDetalhado | null = null;

    // Criar registro do cronograma
    const { data: cronogramaData, error: cronogramaError } = await client
      .from("cronogramas")
      .insert({
        empresa_id: empresaId,
        aluno_id: input.aluno_id,
        curso_alvo_id: input.curso_alvo_id || null,
        nome: input.nome || "Meu Cronograma",
        data_inicio: input.data_inicio,
        data_fim: input.data_fim,
        dias_estudo_semana: input.dias_semana,
        horas_estudo_dia: input.horas_dia,
        periodos_ferias: (input.ferias ||
          []) as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["periodos_ferias"],
        prioridade_minima: input.prioridade_minima,
        modalidade_estudo: input.modalidade,
        disciplinas_selecionadas:
          input.disciplinas_ids as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["disciplinas_selecionadas"],
        ordem_frentes_preferencia: (input.ordem_frentes_preferencia ||
          null) as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["ordem_frentes_preferencia"],
        modulos_selecionados: (input.modulos_ids?.length
          ? input.modulos_ids
          : null) as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["modulos_selecionados"],
        excluir_aulas_concluidas: input.excluir_aulas_concluidas !== false,
        velocidade_reproducao: input.velocidade_reproducao ?? 1.0,
      } as Database["public"]["Tables"]["cronogramas"]["Insert"])
      .select()
      .single();

    if (cronogramaError || !cronogramaData) {
      console.error("[CronogramaService] Erro ao criar cronograma:", {
        message: cronogramaError?.message,
        details: cronogramaError?.details,
        hint: cronogramaError?.hint,
        code: cronogramaError?.code,
      });

      // Se for erro 409 (Conflict), lançar erro específico
      if (
        cronogramaError?.code === "23505" ||
        cronogramaError?.code === "PGRST116"
      ) {
        throw new CronogramaConflictError(
          `Erro ao criar cronograma: ${cronogramaError.message || "Conflito ao criar cronograma"}`,
        );
      }

      // Se o erro mencionar schema cache, limpar cache e tentar novamente
      if (
        cronogramaError?.message?.includes("schema cache") ||
        cronogramaError?.message?.includes("Could not find")
      ) {
        console.warn(
          "[CronogramaService] Problema com schema cache detectado, limpando cache...",
        );
        clearDatabaseClientCache();

        // Tentar inserir sem as colunas que podem estar causando problema
        console.warn(
          "[CronogramaService] Tentando criar cronograma sem as colunas novas...",
        );
        const { data: cronogramaFallback, error: fallbackError } = await client
          .from("cronogramas")
          .insert({
            empresa_id: empresaId,
            aluno_id: input.aluno_id,
            curso_alvo_id: input.curso_alvo_id || null,
            nome: input.nome || "Meu Cronograma",
            data_inicio: input.data_inicio,
            data_fim: input.data_fim,
            dias_estudo_semana: input.dias_semana,
            horas_estudo_dia: input.horas_dia,
            periodos_ferias: (input.ferias ||
              []) as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["periodos_ferias"],
            prioridade_minima: input.prioridade_minima,
            modalidade_estudo: input.modalidade,
            disciplinas_selecionadas:
              input.disciplinas_ids as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["disciplinas_selecionadas"],
            ordem_frentes_preferencia: (input.ordem_frentes_preferencia ||
              null) as unknown as Database["public"]["Tables"]["cronogramas"]["Insert"]["ordem_frentes_preferencia"],
          })
          .select()
          .single();

        if (fallbackError || !cronogramaFallback) {
          throw new Error(
            `Erro ao criar cronograma: ${fallbackError?.message || cronogramaError?.message || "Desconhecido"}`,
          );
        }

        cronograma = mapToCronogramaDetalhado(cronogramaFallback);

        // Verificar se cronograma foi criado com sucesso
        if (!cronograma) {
          throw new Error("Falha ao criar cronograma no fallback");
        }

        // Cronograma confirmado como não-nulo para este bloco
        const cronogramaFallbackConfirmado = cronograma;

        // Tentar atualizar com as colunas novas separadamente (se existirem)
        try {
          const updateData: Partial<
            Pick<
              CronogramaDetalhado,
              "modulos_selecionados" | "excluir_aulas_concluidas"
            >
          > = {};
          if (input.modulos_ids?.length) {
            updateData.modulos_selecionados = input.modulos_ids;
          }
          if (input.excluir_aulas_concluidas !== undefined) {
            updateData.excluir_aulas_concluidas =
              input.excluir_aulas_concluidas;
          }

          if (Object.keys(updateData).length > 0) {
            const { data: cronogramaUpdated, error: updateError } = await client
              .from("cronogramas")
              .update(updateData)
              .eq("id", cronogramaFallbackConfirmado.id)
              .select()
              .single();

            if (!updateError && cronogramaUpdated) {
              cronograma = mapToCronogramaDetalhado(cronogramaUpdated);
            } else {
              console.warn(
                "[CronogramaService] Não foi possível atualizar alguns campos novos, mas cronograma foi criado",
              );
            }
          }
        } catch (updateErr) {
          console.warn(
            "[CronogramaService] Erro ao atualizar campos novos (ignorado):",
            updateErr,
          );
        }
      } else {
        throw new Error(
          `Erro ao criar cronograma: ${cronogramaError?.message || "Desconhecido"}`,
        );
      }
    } else {
      cronograma = mapToCronogramaDetalhado(cronogramaData);
    }

    // Verificar se cronograma foi criado com sucesso
    if (!cronograma) {
      throw new Error("Falha ao criar cronograma");
    }

    // Agora cronograma é garantidamente não-nulo
    const cronogramaConfirmado = cronograma;

    // IMPORTANTE: Sempre salvar os itens, independente de como o cronograma foi criado
    // Preencher cronograma_id nos itens
    const itensCompleto = itens.map((item) => ({
      ...item,
      cronograma_id: cronogramaConfirmado.id,
    }));

    console.log("[CronogramaService] Inserindo itens do cronograma:", {
      totalItens: itensCompleto.length,
      cronogramaId: cronogramaConfirmado.id,
      primeirosItens: itensCompleto.slice(0, 3).map((i) => ({
        aula_id: i.aula_id,
        semana_numero: i.semana_numero,
        ordem_na_semana: i.ordem_na_semana,
      })),
    });

    // Bulk insert dos itens
    const { data: itensInseridos, error: itensError } = await client
      .from("cronograma_itens")
      .insert(itensCompleto)
      .select("id, aula_id, semana_numero, ordem_na_semana");

    if (itensError) {
      console.error("[CronogramaService] Erro ao inserir itens:", {
        message: itensError.message,
        details: itensError.details,
        hint: itensError.hint,
        code: itensError.code,
        totalItens: itensCompleto.length,
      });
      // Tentar deletar o cronograma criado
      await client
        .from("cronogramas")
        .delete()
        .eq("id", cronogramaConfirmado.id);
      throw new Error(
        `Erro ao inserir itens do cronograma: ${itensError.message}`,
      );
    }

    console.log("[CronogramaService] Itens inseridos com sucesso:", {
      totalInseridos: itensInseridos?.length || 0,
      esperado: itensCompleto.length,
    });

    // Criar distribuição padrão de dias
    await this.criarDistribuicaoPadrao(
      client,
      cronogramaConfirmado.id,
      input.dias_semana,
    );

    // Recalcular datas dos itens baseado na distribuição padrão
    try {
      await this.recalcularDatasItens(cronogramaConfirmado.id, input.aluno_id);
    } catch (recalcError) {
      console.error(
        "[CronogramaService] Erro ao recalcular datas (não crítico):",
        recalcError,
      );
      // Não falhar a criação do cronograma se o recálculo falhar
    }

    // Buscar cronograma completo com itens
    const { data: cronogramaCompleto, error: fetchError } = await client
      .from("cronogramas")
      .select(
        `
        *,
        cronograma_itens(
          id,
          aula_id,
          semana_numero,
          ordem_na_semana,
          concluido,
          aulas(
            id,
            nome,
            numero_aula,
            tempo_estimado_minutos
          )
        )
      `,
      )
      .eq("id", cronogramaConfirmado.id)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar cronograma completo:", fetchError);
      return cronogramaConfirmado;
    }

    if (!cronogramaCompleto) {
      return cronogramaConfirmado;
    }

    return mapToCronogramaDetalhado(
      cronogramaCompleto as Database["public"]["Tables"]["cronogramas"]["Row"],
    );
  }

  /**
   * Busca a distribuição de dias da semana para um cronograma
   */
  async buscarDistribuicaoDias(
    cronogramaId: string,
    userId: string,
  ): Promise<CronogramaSemanasDias | null> {
    const client = getDatabaseClient();

    // Verificar se o cronograma pertence ao usuário
    const { data: cronograma, error: cronogramaError } = await client
      .from("cronogramas")
      .select("id, aluno_id")
      .eq("id", cronogramaId)
      .single();

    if (cronogramaError || !cronograma) {
      throw new CronogramaValidationError("Cronograma não encontrado");
    }

    if (cronograma.aluno_id !== userId) {
      throw new CronogramaValidationError(
        "Você só pode acessar seus próprios cronogramas",
      );
    }

    // Buscar distribuição
    const { data, error } = await client
      .from("cronograma_semanas_dias")
      .select("*")
      .eq("cronograma_id", cronogramaId)
      .maybeSingle();

    if (error) {
      console.error(
        "[CronogramaService] Erro ao buscar distribuição de dias:",
        error,
      );
      throw new Error(`Erro ao buscar distribuição de dias: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      cronograma_id: data.cronograma_id,
      dias_semana: data.dias_semana || [],
      created_at: new Date(data.created_at ?? new Date().toISOString()),
      updated_at: new Date(data.updated_at ?? new Date().toISOString()),
    };
  }

  /**
   * Salva ou atualiza a distribuição de dias da semana para um cronograma
   */
  async atualizarDistribuicaoDias(
    input: AtualizarDistribuicaoDiasInput,
    userId: string,
  ): Promise<CronogramaSemanasDias> {
    const client = getDatabaseClient();

    // Validar dias da semana (0-6)
    const diasValidos = input.dias_semana.every((dia) => dia >= 0 && dia <= 6);
    if (!diasValidos || input.dias_semana.length === 0) {
      throw new CronogramaValidationError(
        "dias_semana deve ser um array de números entre 0 (domingo) e 6 (sábado)",
      );
    }

    // Verificar se o cronograma pertence ao usuário
    const { data: cronograma, error: cronogramaError } = await client
      .from("cronogramas")
      .select("id, aluno_id, data_inicio")
      .eq("id", input.cronograma_id)
      .single();

    if (cronogramaError || !cronograma) {
      throw new CronogramaValidationError("Cronograma não encontrado");
    }

    if (cronograma.aluno_id !== userId) {
      throw new CronogramaValidationError(
        "Você só pode atualizar seus próprios cronogramas",
      );
    }

    // Verificar se já existe distribuição
    const { data: existente } = await client
      .from("cronograma_semanas_dias")
      .select("id")
      .eq("cronograma_id", input.cronograma_id)
      .maybeSingle();

    let resultado;
    if (existente) {
      // Atualizar
      const { data, error } = await client
        .from("cronograma_semanas_dias")
        .update({
          dias_semana: input.dias_semana,
        })
        .eq("id", existente.id)
        .select()
        .single();

      if (error) {
        console.error(
          "[CronogramaService] Erro ao atualizar distribuição de dias:",
          error,
        );
        throw new Error(
          `Erro ao atualizar distribuição de dias: ${error.message}`,
        );
      }

      resultado = data;
    } else {
      // Criar
      const { data, error } = await client
        .from("cronograma_semanas_dias")
        .insert({
          cronograma_id: input.cronograma_id,
          dias_semana: input.dias_semana,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "[CronogramaService] Erro ao criar distribuição de dias:",
          error,
        );
        throw new Error(`Erro ao criar distribuição de dias: ${error.message}`);
      }

      resultado = data;
    }

    // Recalcular datas dos itens
    await this.recalcularDatasItens(input.cronograma_id, userId);

    return {
      id: resultado.id,
      cronograma_id: resultado.cronograma_id,
      dias_semana: resultado.dias_semana || [],
      created_at: new Date(resultado.created_at ?? new Date().toISOString()),
      updated_at: new Date(resultado.updated_at ?? new Date().toISOString()),
    };
  }

  /**
   * Recalcula as datas previstas de todos os itens do cronograma
   * baseado na distribuição de dias da semana
   */
  async recalcularDatasItens(
    cronogramaId: string,
    userId: string,
  ): Promise<RecalcularDatasResult> {
    const client = getDatabaseClient();

    // Verificar se o cronograma pertence ao usuário
    const { data: cronograma, error: cronogramaError } = await client
      .from("cronogramas")
      .select("id, aluno_id, data_inicio")
      .eq("id", cronogramaId)
      .single();

    if (cronogramaError || !cronograma) {
      throw new CronogramaValidationError("Cronograma não encontrado");
    }

    if (cronograma.aluno_id !== userId) {
      throw new CronogramaValidationError(
        "Você só pode recalcular datas dos seus próprios cronogramas",
      );
    }

    // Buscar distribuição de dias
    const { data: distribuicao, error: distError } = await client
      .from("cronograma_semanas_dias")
      .select("dias_semana")
      .eq("cronograma_id", cronogramaId)
      .maybeSingle();

    if (distError) {
      console.error(
        "[CronogramaService] Erro ao buscar distribuição de dias:",
        distError,
      );
      throw new Error(
        `Erro ao buscar distribuição de dias: ${distError.message}`,
      );
    }

    // Se não houver distribuição, usar padrão (segunda a sexta)
    const diasSemana = distribuicao?.dias_semana || [1, 2, 3, 4, 5];

    console.log(`[CronogramaService] Distribuição de dias encontrada:`, {
      cronogramaId,
      distribuicaoExiste: !!distribuicao,
      diasSemana,
      diasSemanaTipo: typeof diasSemana,
      diasSemanaIsArray: Array.isArray(diasSemana),
    });

    // Buscar todos os itens do cronograma com informações de disciplina e frente
    // Necessário para ordenar por disciplina → frente → ordem
    const { data: itens, error: itensError } = await client
      .from("cronograma_itens")
      .select(
        `
        id, 
        semana_numero, 
        ordem_na_semana,
        aula_id,
        aulas!inner(
          id,
          modulos!inner(
            id,
            frentes!inner(
              id,
              nome,
              disciplina_id,
              disciplinas!inner(
                id,
                nome
              )
            )
          )
        )
      `,
      )
      .eq("cronograma_id", cronogramaId)
      .order("semana_numero", { ascending: true })
      .order("ordem_na_semana", { ascending: true });

    if (itensError) {
      console.error("[CronogramaService] Erro ao buscar itens:", itensError);
      throw new Error(`Erro ao buscar itens: ${itensError.message}`);
    }

    if (!itens || itens.length === 0) {
      return { success: true, itens_atualizados: 0 };
    }

    // Calcular datas agrupando por semana
    const dataInicio = new Date(cronograma.data_inicio);
    const atualizacoes: Array<{ id: string; data_prevista: string }> = [];

    // Ordenar dias da semana (0=domingo, 1=segunda, ..., 6=sábado)
    const diasOrdenados = [...diasSemana].sort((a, b) => a - b);

    // Função helper para extrair informações de disciplina e frente de um item
    // Tipo helper para itens com dados aninhados do Supabase
    type ItemComAula = {
      id: string;
      semana_numero: number;
      ordem_na_semana: number;
      aula_id: string;
      aulas: {
        id: string;
        modulos: {
          id: string;
          frentes: {
            id: string;
            nome: string;
            disciplina_id: string | null;
            disciplinas: { id: string; nome: string } | null;
          };
        };
      };
    };

    const extrairInfoItem = (item: ItemComAula) => {
      // Supabase pode retornar dados aninhados de diferentes formas
      const aula = item.aulas;
      const modulo = aula?.modulos || null;
      const frente = modulo?.frentes || null;
      const disciplina = frente?.disciplinas || null;

      return {
        disciplinaId: disciplina?.id || "",
        disciplinaNome: disciplina?.nome || "",
        frenteId: frente?.id || "",
        frenteNome: frente?.nome || "",
      };
    };

    // Agrupar itens por semana primeiro
    const itensPorSemana = new Map<number, ItemComAula[]>();
    itens.forEach((item) => {
      const semana = item.semana_numero;
      if (!itensPorSemana.has(semana)) {
        itensPorSemana.set(semana, []);
      }
      itensPorSemana.get(semana)!.push(item);
    });

    // Função para reorganizar itens de uma semana: alternar entre disciplinas e frentes
    const reorganizarItensPorSemana = (itensDaSemana: ItemComAula[]) => {
      // Extrair informações de cada item
      const itensComInfo = itensDaSemana.map((item) => ({
        ...item,
        info: extrairInfoItem(item),
      }));

      // Usar tipo inferido do array
      type ItemComInfo = (typeof itensComInfo)[0];

      // Agrupar por frente (todas as Frentes A, depois todas as Frentes B, etc.)
      const itensPorFrente = new Map<string, ItemComInfo[]>();
      itensComInfo.forEach((item) => {
        const frenteKey = `${item.info.disciplinaNome}_${item.info.frenteNome}`;
        if (!itensPorFrente.has(frenteKey)) {
          itensPorFrente.set(frenteKey, []);
        }
        itensPorFrente.get(frenteKey)!.push(item);
      });

      // Ordenar itens dentro de cada grupo por ordem_na_semana
      itensPorFrente.forEach((itensGrupo) => {
        itensGrupo.sort((a, b) => a.ordem_na_semana - b.ordem_na_semana);
      });

      // Agrupar por nome da frente (todas as Frentes A, depois todas as Frentes B, etc.)
      // Isso permite alternar entre disciplinas dentro da mesma frente
      const frentesPorNome = new Map<string, ItemComInfo[][]>();
      itensPorFrente.forEach((itens) => {
        const frenteNome = itens[0].info.frenteNome;
        if (!frentesPorNome.has(frenteNome)) {
          frentesPorNome.set(frenteNome, []);
        }
        frentesPorNome.get(frenteNome)!.push(itens);
      });

      // Ordenar nomes das frentes alfabeticamente (Frente A, Frente B, etc.)
      const frentesNomes = Array.from(frentesPorNome.keys()).sort();

      // Reorganizar: distribuir round-robin entre disciplinas dentro de cada frente
      // Processar todas as Frentes A primeiro, depois todas as Frentes B, etc.
      const itensReorganizados: ItemComInfo[] = [];

      for (const frenteNome of frentesNomes) {
        const gruposFrente = frentesPorNome.get(frenteNome)!;

        // Ordenar grupos por disciplina para garantir ordem consistente
        gruposFrente.sort((grupoA, grupoB) => {
          const disciplinaA = grupoA[0].info.disciplinaNome;
          const disciplinaB = grupoB[0].info.disciplinaNome;
          return disciplinaA.localeCompare(disciplinaB);
        });

        // Encontrar o máximo de itens em qualquer grupo desta frente
        const maxItens = Math.max(...gruposFrente.map((grupo) => grupo.length));

        // Distribuir round-robin: pegar um item de cada disciplina por vez
        // Exemplo: Disc1 Aula1, Disc2 Aula1, Disc3 Aula1, Disc1 Aula2, Disc2 Aula2, etc.
        for (let i = 0; i < maxItens; i++) {
          for (const grupo of gruposFrente) {
            if (i < grupo.length) {
              const item = grupo[i];
              itensReorganizados.push(item);
            }
          }
        }
      }

      return itensReorganizados;
    };

    // Contador para debug: distribuição de itens por dia da semana e por semana
    const contadorPorDia: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    const contadorPorSemana: Record<number, Record<number, number>> = {};

    logDebug(`[CronogramaService] Iniciando distribuição por semana:`, {
      totalItens: itens.length,
      totalSemanas: itensPorSemana.size,
      diasSelecionados: diasOrdenados,
      itensPorSemana: Array.from(itensPorSemana.entries()).map(
        ([semana, itens]) => ({
          semana,
          totalItens: itens.length,
        }),
      ),
    });

    // Processar cada semana separadamente
    Array.from(itensPorSemana.entries())
      .sort(([a], [b]) => a - b) // Ordenar por número da semana
      .forEach(([semanaNumero, itensDaSemanaOriginal]) => {
        // Reorganizar itens para alternar entre disciplinas e frentes
        const itensDaSemana = reorganizarItensPorSemana(itensDaSemanaOriginal);
        // Calcular data base da semana: data_inicio + (semana_numero - 1) * 7 dias
        const dataBaseSemana = new Date(dataInicio);
        dataBaseSemana.setDate(
          dataBaseSemana.getDate() + (semanaNumero - 1) * 7,
        );

        // Calcular o período da semana do cronograma (7 dias a partir da data base)
        const dataFimSemana = new Date(dataBaseSemana);
        dataFimSemana.setDate(dataFimSemana.getDate() + 6);

        const diaSemanaBase = dataBaseSemana.getDay();

        // Encontrar quais dias selecionados caem dentro desta semana do cronograma
        // A semana do cronograma vai de dataBaseSemana até dataFimSemana (7 dias)
        const diasNaSemana: number[] = [];
        for (let d = 0; d < 7; d++) {
          const diaSemana = (diaSemanaBase + d) % 7;
          if (diasOrdenados.includes(diaSemana)) {
            diasNaSemana.push(diaSemana);
          }
        }

        // Se não houver dias selecionados nesta semana, usar todos os dias selecionados
        // (mas isso não deveria acontecer)
        const diasParaUsar =
          diasNaSemana.length > 0 ? diasNaSemana : diasOrdenados;
        const numDiasParaUsar = diasParaUsar.length;

        // Ordenar os dias para usar na ordem correta
        const diasParaUsarOrdenados = [...diasParaUsar].sort((a, b) => {
          const indexA = diasOrdenados.indexOf(a);
          const indexB = diasOrdenados.indexOf(b);
          return indexA - indexB;
        });

        // Dividir itens da semana igualmente entre os dias selecionados desta semana
        const totalItensSemana = itensDaSemana.length;
        const itensPorDia = Math.floor(totalItensSemana / numDiasParaUsar);
        const itensRestantes = totalItensSemana % numDiasParaUsar;

        logDebug(`[CronogramaService] Processando semana ${semanaNumero}:`, {
          totalItens: totalItensSemana,
          itensPorDia,
          itensRestantes,
          dataBaseSemana: dataBaseSemana.toISOString().split("T")[0],
          dataFimSemana: dataFimSemana.toISOString().split("T")[0],
          diaSemanaBase,
          diasNaSemana,
          diasParaUsar: diasParaUsarOrdenados,
          numDiasParaUsar,
        });

        // Inicializar contador para esta semana
        contadorPorSemana[semanaNumero] = {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
        };

        let indiceItem = 0;

        // Distribuir itens para cada dia selecionado que cai nesta semana
        for (let i = 0; i < numDiasParaUsar; i++) {
          const diaSemanaEscolhido = diasParaUsarOrdenados[i];

          // Calcular quantos itens este dia receberá
          // Os primeiros dias recebem um item extra se houver resto
          const quantidadeItensParaEsteDia =
            itensPorDia + (i < itensRestantes ? 1 : 0);

          // Calcular a data deste dia na semana
          // Encontrar a primeira ocorrência do dia escolhido dentro do período de 7 dias
          const dataDiaSemana = new Date(dataBaseSemana);
          let diasParaAdicionar = diaSemanaEscolhido - diaSemanaBase;

          // Se o dia escolhido já passou na semana base, está na próxima semana do calendário
          // mas ainda dentro do período de 7 dias da semana do cronograma
          if (diasParaAdicionar < 0) {
            diasParaAdicionar += 7;
          }

          dataDiaSemana.setDate(dataDiaSemana.getDate() + diasParaAdicionar);

          // Verificar se a data está dentro do período de 7 dias da semana do cronograma
          if (dataDiaSemana < dataBaseSemana || dataDiaSemana > dataFimSemana) {
            logError(
              `[CronogramaService] ⚠️ Data calculada está fora do período da semana ${semanaNumero}:`,
              {
                dataBaseSemana: dataBaseSemana.toISOString().split("T")[0],
                dataFimSemana: dataFimSemana.toISOString().split("T")[0],
                dataCalculada: dataDiaSemana.toISOString().split("T")[0],
                diaSemanaEscolhido,
                diaSemanaBase,
                diasParaAdicionar,
              },
            );
            // Ajustar para ficar dentro do período (usar data base como fallback)
            dataDiaSemana.setTime(dataBaseSemana.getTime());
          }

          // Atribuir itens a este dia
          for (
            let j = 0;
            j < quantidadeItensParaEsteDia && indiceItem < totalItensSemana;
            j++
          ) {
            const item = itensDaSemana[indiceItem];

            // Garantir formato YYYY-MM-DD consistente (sem conversão UTC)
            const year = dataDiaSemana.getFullYear();
            const month = String(dataDiaSemana.getMonth() + 1).padStart(2, "0");
            const day = String(dataDiaSemana.getDate()).padStart(2, "0");
            const dataPrevistaFormatada = `${year}-${month}-${day}`;

            atualizacoes.push({
              id: item.id,
              data_prevista: dataPrevistaFormatada,
            });

            // Contar para debug
            contadorPorDia[diaSemanaEscolhido] += 1;
            contadorPorSemana[semanaNumero][diaSemanaEscolhido] += 1;

            indiceItem++;

            // Log detalhado para primeiros itens de cada semana
            if (indiceItem <= 3 || j === 0) {
              logDebug(
                `[CronogramaService] Semana ${semanaNumero}, Item ${indiceItem}/${totalItensSemana}:`,
                {
                  itemId: item.id,
                  ordem_na_semana: item.ordem_na_semana,
                  diaSemana: diaSemanaEscolhido,
                  data_prevista: dataPrevistaFormatada,
                  quantidadeItensParaEsteDia,
                },
              );
            }
          }
        }

        // Verificar se todos os itens da semana foram distribuídos
        if (indiceItem !== totalItensSemana) {
          logError(
            `[CronogramaService] ⚠️ Erro: Nem todos os itens da semana ${semanaNumero} foram distribuídos!`,
            {
              esperado: totalItensSemana,
              distribuido: indiceItem,
            },
          );
        }
      });

    // Log da distribuição final por dia da semana e por semana
    const totalItens = Object.values(contadorPorDia).reduce((a, b) => a + b, 0);
    const itensPorDiaSelecionado = diasOrdenados.map((dia) => ({
      dia: [
        "domingo",
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
      ][dia],
      valor: dia,
      quantidade: contadorPorDia[dia],
      percentual:
        totalItens > 0
          ? ((contadorPorDia[dia] / totalItens) * 100).toFixed(1) + "%"
          : "0%",
    }));

    logDebug(`[CronogramaService] Distribuição final por dia da semana:`, {
      total: totalItens,
      dias_selecionados: diasOrdenados,
      distribuicao_por_dia: itensPorDiaSelecionado,
    });

    // Log da distribuição por semana
    logDebug(
      `[CronogramaService] Distribuição por semana:`,
      Array.from(Object.entries(contadorPorSemana)).map(
        ([semana, contadores]) => ({
          semana: Number(semana),
          totalItens: Object.values(contadores).reduce((a, b) => a + b, 0),
          porDia: diasOrdenados.map((dia) => ({
            dia: [
              "domingo",
              "segunda",
              "terca",
              "quarta",
              "quinta",
              "sexta",
              "sabado",
            ][dia],
            quantidade: contadores[dia] || 0,
          })),
        }),
      ),
    );

    // Atualizar itens em lote usando chunks para melhor performance
    // Processar em lotes de 100 itens por vez
    const CHUNK_SIZE = 100;
    let itensAtualizados = 0;
    const erros: Array<{ id: string; error: string }> = [];

    // Processar em chunks
    for (let i = 0; i < atualizacoes.length; i += CHUNK_SIZE) {
      const chunk = atualizacoes.slice(i, i + CHUNK_SIZE);

      // Usar Promise.all para processar chunk em paralelo
      const resultados = await Promise.allSettled(
        chunk.map(async (atualizacao) => {
          const { error: updateError } = await client
            .from("cronograma_itens")
            .update({ data_prevista: atualizacao.data_prevista })
            .eq("id", atualizacao.id);

          if (updateError) {
            throw new Error(`Item ${atualizacao.id}: ${updateError.message}`);
          }
          return atualizacao.id;
        }),
      );

      // Contar sucessos e erros
      resultados.forEach((resultado, index) => {
        if (resultado.status === "fulfilled") {
          itensAtualizados++;
        } else {
          const atualizacao = chunk[index];
          erros.push({
            id: atualizacao.id,
            error: resultado.reason?.message || "Erro desconhecido",
          });
          console.error(
            `[CronogramaService] Erro ao atualizar item ${atualizacao.id}:`,
            resultado.reason,
          );
        }
      });
    }

    // Validação de integridade: verificar se todos os itens foram atualizados
    if (itensAtualizados < atualizacoes.length) {
      console.warn(
        `[CronogramaService] ⚠️ Apenas ${itensAtualizados} de ${atualizacoes.length} itens foram atualizados`,
      );
      console.warn(
        `[CronogramaService] Erros encontrados:`,
        erros.slice(0, 10),
      ); // Logar apenas primeiros 10 erros

      // Se menos de 90% dos itens foram atualizados, considerar como falha crítica
      const taxaSucesso = itensAtualizados / atualizacoes.length;
      if (taxaSucesso < 0.9) {
        logError(
          `[CronogramaService] Falha crítica: apenas ${itensAtualizados} de ${atualizacoes.length} itens foram atualizados (${(taxaSucesso * 100).toFixed(1)}%)`,
        );
        throw new Error(
          `Falha ao atualizar datas: apenas ${itensAtualizados} de ${atualizacoes.length} itens foram atualizados (${(taxaSucesso * 100).toFixed(1)}%)`,
        );
      }
    }

    logDebug(
      `[CronogramaService] Datas recalculadas: ${itensAtualizados} de ${atualizacoes.length} itens`,
    );

    return { success: true, itens_atualizados: itensAtualizados };
  }

  /**
   * Calcula estatísticas detalhadas por semana do cronograma
   */
  async calcularEstatisticasPorSemana(
    cronogramaId: string,
    userId: string,
  ): Promise<EstatisticasSemanasResult> {
    const client = getDatabaseClient();

    // Verificar se o cronograma pertence ao usuário
    const { data: cronogramaRaw, error: cronogramaError } = await client
      .from("cronogramas")
      .select(
        "id, aluno_id, data_inicio, data_fim, horas_estudo_dia, dias_estudo_semana, periodos_ferias, velocidade_reproducao",
      )
      .eq("id", cronogramaId)
      .single();

    if (cronogramaError || !cronogramaRaw) {
      throw new CronogramaValidationError("Cronograma não encontrado");
    }

    const cronograma = cronogramaRaw as unknown as {
      id: string;
      aluno_id: string;
      data_inicio: string;
      data_fim: string;
      horas_estudo_dia: number;
      dias_estudo_semana: number;
      periodos_ferias: unknown;
      velocidade_reproducao: number | null;
    };

    if (cronograma.aluno_id !== userId) {
      throw new CronogramaValidationError(
        "Você só pode acessar seus próprios cronogramas",
      );
    }

    // Buscar todos os itens do cronograma com suas aulas
    const { data: itens, error: itensError } = await client
      .from("cronograma_itens")
      .select(
        `
        id,
        semana_numero,
        ordem_na_semana,
        concluido,
        aula_id,
        aulas(
          id,
          tempo_estimado_minutos
        )
      `,
      )
      .eq("cronograma_id", cronogramaId)
      .order("semana_numero", { ascending: true })
      .order("ordem_na_semana", { ascending: true });

    if (itensError) {
      console.error("[CronogramaService] Erro ao buscar itens:", itensError);
      throw new Error(`Erro ao buscar itens: ${itensError.message}`);
    }

    // Calcular semanas (mesma lógica do calcularSemanas)
    const dataInicio = new Date(cronograma.data_inicio);
    const dataFim = new Date(cronograma.data_fim);
    const ferias =
      (cronograma.periodos_ferias as unknown as FeriasPeriodo[]) || [];
    const horasDia = cronograma.horas_estudo_dia || 0;
    const diasSemana = cronograma.dias_estudo_semana || 0;
    const velocidadeReproducao = cronograma.velocidade_reproducao ?? 1.0;

    const semanas = this.calcularSemanas(
      dataInicio,
      dataFim,
      ferias,
      horasDia,
      diasSemana,
    );

    // Agrupar itens por semana
    // Tipo helper para itens com dados aninhados do Supabase
    type ItemComDados = {
      id: string;
      semana_numero: number;
      ordem_na_semana: number;
      concluido?: boolean | null;
      aula_id: string;
      aulas?: {
        id: string;
        tempo_estimado_minutos?: number | null;
      } | null;
    };

    const itensPorSemana = new Map<number, ItemComDados[]>();
    ((itens as unknown as ItemComDados[]) || []).forEach((item) => {
      const semanaNum = item.semana_numero;
      if (!itensPorSemana.has(semanaNum)) {
        itensPorSemana.set(semanaNum, []);
      }
      itensPorSemana.get(semanaNum)!.push(item);
    });

    // Calcular estatísticas para cada semana
    const semanasEstatisticas: SemanaEstatisticas[] = semanas.map((semana) => {
      const itensDaSemana = itensPorSemana.get(semana.numero) || [];

      // Calcular tempo usado (soma dos custos das aulas)
      let tempoUsado = 0;
      let totalAulas = 0;
      let aulasConcluidas = 0;

      itensDaSemana.forEach((item) => {
        const aula = Array.isArray(item.aulas) ? item.aulas[0] : item.aulas;
        if (!aula) return;

        totalAulas++;
        if (item.concluido) {
          aulasConcluidas++;
        }

        // Calcular custo (mesma lógica do gerarCronograma)
        const tempoOriginal =
          aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS;
        const tempoAulaAjustado = tempoOriginal / velocidadeReproducao;
        const custo = tempoAulaAjustado * FATOR_MULTIPLICADOR;
        tempoUsado += custo;
      });

      const capacidade = semana.capacidade_minutos;
      const tempoDisponivel = Math.max(0, capacidade - tempoUsado);
      const percentualUsado =
        capacidade > 0 ? (tempoUsado / capacidade) * 100 : 0;
      const aulasPendentes = totalAulas - aulasConcluidas;

      return {
        semana_numero: semana.numero,
        data_inicio: semana.data_inicio.toISOString(),
        data_fim: semana.data_fim.toISOString(),
        capacidade_minutos: capacidade,
        tempo_usado_minutos: Math.round(tempoUsado * 100) / 100, // Arredondar para 2 casas decimais
        tempo_disponivel_minutos: Math.round(tempoDisponivel * 100) / 100,
        percentual_usado: Math.round(percentualUsado * 100) / 100,
        is_ferias: semana.is_ferias,
        total_aulas: totalAulas,
        aulas_concluidas: aulasConcluidas,
        aulas_pendentes: aulasPendentes,
      };
    });

    // Calcular resumo geral
    const semanasUteis = semanasEstatisticas.filter((s) => !s.is_ferias);
    const capacidadeTotal = semanasUteis.reduce(
      (acc, s) => acc + s.capacidade_minutos,
      0,
    );
    const tempoTotalUsado = semanasEstatisticas.reduce(
      (acc, s) => acc + s.tempo_usado_minutos,
      0,
    );
    const tempoTotalDisponivel = semanasEstatisticas.reduce(
      (acc, s) => acc + s.tempo_disponivel_minutos,
      0,
    );
    const percentualMedioUsado =
      semanasUteis.length > 0
        ? semanasUteis.reduce((acc, s) => acc + s.percentual_usado, 0) /
          semanasUteis.length
        : 0;
    const totalAulas = semanasEstatisticas.reduce(
      (acc, s) => acc + s.total_aulas,
      0,
    );
    const totalAulasConcluidas = semanasEstatisticas.reduce(
      (acc, s) => acc + s.aulas_concluidas,
      0,
    );
    const semanasSobrecarregadas = semanasEstatisticas.filter(
      (s) => s.percentual_usado > 100,
    ).length;

    return {
      success: true,
      semanas: semanasEstatisticas,
      resumo: {
        total_semanas: semanasEstatisticas.length,
        semanas_uteis: semanasUteis.length,
        semanas_ferias: semanasEstatisticas.length - semanasUteis.length,
        capacidade_total_minutos: Math.round(capacidadeTotal * 100) / 100,
        tempo_total_usado_minutos: Math.round(tempoTotalUsado * 100) / 100,
        tempo_total_disponivel_minutos:
          Math.round(tempoTotalDisponivel * 100) / 100,
        percentual_medio_usado: Math.round(percentualMedioUsado * 100) / 100,
        total_aulas: totalAulas,
        total_aulas_concluidas: totalAulasConcluidas,
        semanas_sobrecarregadas: semanasSobrecarregadas,
      },
    };
  }

  /**
   * Cria distribuição padrão ao gerar um novo cronograma
   */
  private async criarDistribuicaoPadrao(
    client: ReturnType<typeof getDatabaseClient>,
    cronogramaId: string,
    diasEstudoSemana: number,
  ): Promise<void> {
    // Calcular dias padrão baseado em dias_estudo_semana
    // Se dias_estudo_semana = 5, usar segunda a sexta [1,2,3,4,5]
    // Se dias_estudo_semana = 3, usar segunda, quarta, sexta [1,3,5]
    // etc.
    let diasPadrao: number[] = [];

    if (diasEstudoSemana >= 5) {
      diasPadrao = [1, 2, 3, 4, 5]; // Segunda a sexta
    } else if (diasEstudoSemana === 4) {
      diasPadrao = [1, 2, 4, 5]; // Segunda, terça, quinta, sexta
    } else if (diasEstudoSemana === 3) {
      diasPadrao = [1, 3, 5]; // Segunda, quarta, sexta
    } else if (diasEstudoSemana === 2) {
      diasPadrao = [1, 4]; // Segunda e quinta
    } else {
      diasPadrao = [1]; // Apenas segunda
    }

    const { error } = await client.from("cronograma_semanas_dias").insert({
      cronograma_id: cronogramaId,
      dias_semana: diasPadrao,
    });

    if (error) {
      console.error(
        "[CronogramaService] Erro ao criar distribuição padrão:",
        error,
      );
      // Não lançar erro, apenas logar - a distribuição pode ser criada depois
    } else {
      console.log(
        "[CronogramaService] Distribuição padrão criada:",
        diasPadrao,
      );
    }
  }
}

export const cronogramaService = new CronogramaService();
