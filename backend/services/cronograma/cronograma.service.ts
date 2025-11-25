import { getDatabaseClient, clearDatabaseClientCache } from '@/backend/clients/database';
import {
  GerarCronogramaInput,
  GerarCronogramaResult,
  AulaCompleta,
  FrenteDistribuicao,
  SemanaInfo,
  ItemDistribuicao,
} from './cronograma.types';
import {
  CronogramaValidationError,
  CronogramaTempoInsuficienteError,
  CronogramaConflictError,
} from './errors';

const TEMPO_PADRAO_MINUTOS = 10;
const FATOR_MULTIPLICADOR = 1.5;

export class CronogramaService {
  async gerarCronograma(
    input: GerarCronogramaInput,
    userId: string,
    userEmail?: string,
  ): Promise<GerarCronogramaResult> {
    console.log('[CronogramaService] Iniciando geração de cronograma:', {
      aluno_id: input.aluno_id,
      userId,
      userEmail,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim,
      disciplinas_count: input.disciplinas_ids?.length || 0,
    });

    // Validações básicas
    if (!input.aluno_id || !input.data_inicio || !input.data_fim) {
      throw new CronogramaValidationError('Campos obrigatórios: aluno_id, data_inicio, data_fim');
    }

    // Verificar se aluno_id corresponde ao usuário autenticado
    if (input.aluno_id !== userId) {
      throw new CronogramaValidationError('Você só pode criar cronogramas para si mesmo');
    }

    // Validar datas
    const dataInicio = new Date(input.data_inicio);
    const dataFim = new Date(input.data_fim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      throw new CronogramaValidationError('Datas inválidas');
    }

    if (dataFim <= dataInicio) {
      throw new CronogramaValidationError('data_fim deve ser posterior a data_inicio');
    }

    const client = getDatabaseClient();

    // Verificar se o aluno existe, se não existir, criar
    await this.ensureAlunoExists(client, userId, userEmail);

    // Deletar cronograma anterior do aluno (se existir)
    await this.deletarCronogramaAnterior(client, userId);

    const excluirConcluidas = input.excluir_aulas_concluidas !== false;
    const aulasConcluidas = excluirConcluidas
      ? await this.buscarAulasConcluidas(client, input.aluno_id, input.curso_alvo_id)
      : new Set<string>();

    // ============================================
    // ETAPA 1: Cálculo de Capacidade
    // ============================================

    const semanas = this.calcularSemanas(dataInicio, dataFim, input.ferias, input.horas_dia, input.dias_semana);
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
        'Nenhuma aula disponível após aplicar os filtros selecionados.',
      );
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

    const custoTotalNecessario = aulasComCusto.reduce((acc, aula) => acc + aula.custo, 0);

    // ============================================
    // ETAPA 4: Verificação de Viabilidade
    // ============================================

    if (custoTotalNecessario > capacidadeTotal) {
      const horasNecessarias = custoTotalNecessario / 60;
      const horasDisponiveis = capacidadeTotal / 60;
      const semanasUteis = semanas.filter((s) => !s.is_ferias).length;
      const horasDiaNecessarias = horasNecessarias / (semanasUteis * input.dias_semana);

      throw new CronogramaTempoInsuficienteError('Tempo insuficiente', {
        horas_necessarias: Math.ceil(horasNecessarias),
        horas_disponiveis: Math.ceil(horasDisponiveis),
        horas_dia_necessarias: Math.ceil(horasDiaNecessarias * 10) / 10,
        horas_dia_atual: input.horas_dia,
      });
    }

    // ============================================
    // ETAPA 5: Algoritmo de Distribuição
    // ============================================

    const itens = this.distribuirAulas(
      aulasComCusto,
      semanas,
      input.modalidade,
      input.ordem_frentes_preferencia,
    );

    // ============================================
    // ETAPA 6: Persistência
    // ============================================

    const cronograma = await this.persistirCronograma(client, input, itens);

    const semanasUteis = semanas.filter((s) => !s.is_ferias);

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

  private async deletarCronogramaAnterior(
    client: ReturnType<typeof getDatabaseClient>,
    userId: string,
  ): Promise<void> {
    console.log('[CronogramaService] Verificando e deletando cronograma anterior...');
    
    // Buscar cronograma existente do aluno
    const { data: cronogramaExistente, error: selectError } = await client
      .from('cronogramas')
      .select('id')
      .eq('aluno_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('[CronogramaService] Erro ao verificar cronograma existente:', selectError);
      // Não lançar erro, apenas logar - pode não existir cronograma anterior
      return;
    }

    if (cronogramaExistente) {
      console.log('[CronogramaService] Deletando cronograma anterior:', cronogramaExistente.id);
      
      // Deletar cronograma (cascade vai deletar os itens automaticamente devido ao ON DELETE CASCADE)
      const { error: deleteError } = await client
        .from('cronogramas')
        .delete()
        .eq('id', cronogramaExistente.id);

      if (deleteError) {
        console.error('[CronogramaService] Erro ao deletar cronograma anterior:', deleteError);
        throw new Error(`Erro ao deletar cronograma anterior: ${deleteError.message}`);
      }

      console.log('[CronogramaService] Cronograma anterior deletado com sucesso');
    } else {
      console.log('[CronogramaService] Nenhum cronograma anterior encontrado');
    }
  }

  private async ensureAlunoExists(
    client: ReturnType<typeof getDatabaseClient>,
    userId: string,
    userEmail?: string,
  ): Promise<void> {
    // Verificar se o aluno já existe
    const { data: alunoExistente, error: selectError } = await client
      .from('alunos')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('[CronogramaService] Erro ao verificar aluno:', selectError);
      throw new Error(`Erro ao verificar aluno: ${selectError.message}`);
    }

    // Se o aluno não existe, criar um registro básico
    if (!alunoExistente) {
      console.log('[CronogramaService] Aluno não encontrado, criando registro...');
      
      if (!userEmail) {
        throw new CronogramaValidationError('Email do usuário é necessário para criar o registro de aluno');
      }

      const { error: insertError } = await client
        .from('alunos')
        .insert({
          id: userId,
          email: userEmail,
        });

      if (insertError) {
        console.error('[CronogramaService] Erro ao criar aluno:', insertError);
        throw new Error(`Erro ao criar registro de aluno: ${insertError.message}`);
      }

      console.log('[CronogramaService] Registro de aluno criado com sucesso');
    }
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
    console.log('[CronogramaService] Buscando aulas para disciplinas:', disciplinasIds);
    
    // Buscar frentes das disciplinas selecionadas
    let frentesQuery = client
      .from('frentes')
      .select('id')
      .in('disciplina_id', disciplinasIds);

    if (cursoId) {
      frentesQuery = frentesQuery.eq('curso_id', cursoId);
    }

    const { data: frentesData, error: frentesError } = await frentesQuery;

    if (frentesError) {
      console.error('[CronogramaService] Erro ao buscar frentes:', frentesError);
      throw new CronogramaValidationError(`Erro ao buscar frentes: ${frentesError.message}`);
    }

    const frenteIds = frentesData?.map((f) => f.id) || [];

    if (frenteIds.length === 0) {
      throw new CronogramaValidationError('Nenhuma frente encontrada para as disciplinas selecionadas');
    }

    // Buscar módulos das frentes
    let modulosQuery = client
      .from('modulos')
      .select('id')
      .in('frente_id', frenteIds);

    if (cursoId) {
      modulosQuery = modulosQuery.eq('curso_id', cursoId);
    }

    const { data: modulosData, error: modulosError } = await modulosQuery;

    if (modulosError) {
      console.error('[CronogramaService] Erro ao buscar módulos:', modulosError);
      throw new CronogramaValidationError(`Erro ao buscar módulos: ${modulosError.message}`);
    }

    let moduloIds = modulosData?.map((m) => m.id) || [];

    if (modulosSelecionados && modulosSelecionados.length > 0) {
      moduloIds = moduloIds.filter((id) => modulosSelecionados.includes(id));
      if (moduloIds.length === 0) {
        throw new CronogramaValidationError(
          'Nenhum módulo válido encontrado para o curso selecionado.',
        );
      }
    }

    if (moduloIds.length === 0) {
      throw new CronogramaValidationError('Nenhum módulo encontrado para as frentes selecionadas');
    }

    // Buscar aulas dos módulos com filtro de prioridade
    // Não usamos curso_id direto de aulas para evitar problemas de cache/sincronização
    // Filtramos via join com frentes após buscar
    let aulasQuery = client
      .from('aulas')
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
      .in('modulo_id', moduloIds)
      .gte('prioridade', prioridadeMinimaEfetiva)
      .neq('prioridade', 0);

    const { data: aulasDataRaw, error: aulasError } = await aulasQuery;

    if (aulasError) {
      console.error('[CronogramaService] Erro ao buscar aulas:', {
        message: aulasError.message,
        details: aulasError.details,
        hint: aulasError.hint,
        code: aulasError.code,
      });
      
      // Se o erro for sobre curso_id não existir, tentar buscar sem selecionar curso_id
      if (aulasError.message?.includes('curso_id')) {
        console.warn('[CronogramaService] Tentando buscar aulas sem filtro de curso_id...');
        const { data: aulasDataSemFiltro, error: errorSemFiltro } = await client
          .from('aulas')
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
          .in('modulo_id', moduloIds)
          .gte('prioridade', prioridadeMinimaEfetiva)
          .neq('prioridade', 0);
        
        if (errorSemFiltro) {
          throw new CronogramaValidationError(`Erro ao buscar aulas: ${errorSemFiltro.message}`);
        }
        
        // Filtrar por curso_id em memória baseado na frente
        if (aulasDataSemFiltro) {
          const aulasFiltradas = aulasDataSemFiltro.filter((aula: any) => {
            const frenteCursoId = aula.modulos?.frentes?.curso_id;
            return frenteCursoId === cursoId;
          });
          
          if (aulasFiltradas.length === 0) {
            throw new CronogramaValidationError('Nenhuma aula encontrada com os critérios fornecidos');
          }
          
          // Continuar com aulasFiltradas
          const aulas: AulaCompleta[] = aulasFiltradas.map((aula: any) => ({
            id: aula.id,
            nome: aula.nome,
            numero_aula: aula.numero_aula,
            tempo_estimado_minutos: aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS,
            prioridade: aula.prioridade ?? 1,
            modulo_id: aula.modulos.id,
            modulo_nome: aula.modulos.nome,
            numero_modulo: aula.modulos.numero_modulo,
            frente_id: aula.modulos.frentes.id,
            frente_nome: aula.modulos.frentes.nome,
            disciplina_id: aula.modulos.frentes.disciplinas.id,
            disciplina_nome: aula.modulos.frentes.disciplinas.nome,
          }));
          
          return aulas;
        }
      }
      
      console.error('[CronogramaService] Erro ao buscar aulas:', {
        message: aulasError.message,
        details: aulasError.details,
        hint: aulasError.hint,
        code: aulasError.code,
      });
      throw new CronogramaValidationError(`Erro ao buscar aulas: ${aulasError.message}`);
    }

    if (!aulasDataRaw || aulasDataRaw.length === 0) {
      throw new CronogramaValidationError('Nenhuma aula encontrada com os critérios fornecidos');
    }

    // Filtrar por curso_id usando o join com frentes (se fornecido)
    let aulasData = aulasDataRaw;
    if (cursoId) {
      aulasData = aulasDataRaw.filter((aula: any) => {
        const frenteCursoId = aula.modulos?.frentes?.curso_id;
        return frenteCursoId === cursoId;
      });
      
      if (aulasData.length === 0) {
        throw new CronogramaValidationError('Nenhuma aula encontrada para o curso selecionado');
      }
    }

    // Mapear dados para estrutura mais simples
    const aulas: AulaCompleta[] = aulasData.map((aula: any) => ({
      id: aula.id,
      nome: aula.nome,
      numero_aula: aula.numero_aula,
      tempo_estimado_minutos: aula.tempo_estimado_minutos,
      prioridade: aula.prioridade ?? 0,
      modulo_id: aula.modulos.id,
      modulo_nome: aula.modulos.nome,
      numero_modulo: aula.modulos.numero_modulo,
      frente_id: aula.modulos.frentes.id,
      frente_nome: aula.modulos.frentes.nome,
      disciplina_id: aula.modulos.frentes.disciplinas.id,
      disciplina_nome: aula.modulos.frentes.disciplinas.nome,
    }));

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

    return aulas;
  }

  private distribuirAulas(
    aulasComCusto: Array<AulaCompleta & { custo: number }>,
    semanas: SemanaInfo[],
    modalidade: 'paralelo' | 'sequencial',
    ordemFrentesPreferencia?: string[],
  ): ItemDistribuicao[] {
    // Agrupar aulas por frente
    type FrenteComCusto = Omit<FrenteDistribuicao, 'aulas'> & {
      aulas: Array<AulaCompleta & { custo: number }>;
    };
    const frentesMap = new Map<string, FrenteComCusto>();

    for (const aula of aulasComCusto) {
      if (!frentesMap.has(aula.frente_id)) {
        frentesMap.set(aula.frente_id, {
          frente_id: aula.frente_id,
          frente_nome: aula.frente_nome,
          aulas: [],
          custo_total: 0,
          peso: 0,
        });
      }

      const frente = frentesMap.get(aula.frente_id)!;
      frente.aulas.push(aula);
      frente.custo_total += aula.custo;
    }

    const frentes: FrenteComCusto[] = Array.from(frentesMap.values());
    const custoTotalNecessario = aulasComCusto.reduce((acc, aula) => acc + aula.custo, 0);

    // Calcular pesos (modo paralelo)
    if (modalidade === 'paralelo') {
      frentes.forEach((frente) => {
        frente.peso = frente.custo_total / custoTotalNecessario;
      });
    }

    // Ordenar frentes (modo sequencial)
    if (modalidade === 'sequencial' && ordemFrentesPreferencia) {
      const ordemMap = new Map(ordemFrentesPreferencia.map((nome, idx) => [nome, idx]));
      frentes.sort((a, b) => {
        const ordemA = ordemMap.get(a.frente_nome) ?? Infinity;
        const ordemB = ordemMap.get(b.frente_nome) ?? Infinity;
        return ordemA - ordemB;
      });
    }

    // Distribuir aulas por semana
    const itens: ItemDistribuicao[] = [];
    const semanasUteis = semanas.filter((s) => !s.is_ferias);
    let frenteIndex = 0;
    let aulaIndexPorFrente = new Map<string, number>();

    // Inicializar índices de aula por frente
    frentes.forEach((frente) => {
      aulaIndexPorFrente.set(frente.frente_id, 0);
    });

    if (modalidade === 'paralelo') {
      // Modo Paralelo: Distribuir proporcionalmente
      for (const semana of semanasUteis) {
        const capacidadeSemanal = semana.capacidade_minutos;
        let tempoUsado = 0;
        let ordemNaSemana = 1;

        // Distribuir cada frente proporcionalmente
        for (const frente of frentes) {
          const cotaFrente = capacidadeSemanal * frente.peso;
          let tempoFrenteUsado = 0;
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;

          while (
            aulaIndex < frente.aulas.length &&
            tempoFrenteUsado + frente.aulas[aulaIndex].custo <= cotaFrente &&
            tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal
          ) {
            itens.push({
              cronograma_id: '', // Será preenchido após criar cronograma
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++,
            });

            tempoFrenteUsado += frente.aulas[aulaIndex].custo;
            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
          }

          aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
        }

        // Fallback: Se sobrou tempo, preencher com aulas restantes
        for (const frente of frentes) {
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;
          while (
            aulaIndex < frente.aulas.length &&
            tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal
          ) {
            itens.push({
              cronograma_id: '',
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++,
            });

            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
          }
          aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
        }
      }
    } else {
      // Modo Sequencial: Completar uma frente antes de iniciar próxima
      for (const semana of semanasUteis) {
        const capacidadeSemanal = semana.capacidade_minutos;
        let tempoUsado = 0;
        let ordemNaSemana = 1;

        while (frenteIndex < frentes.length && tempoUsado < capacidadeSemanal) {
          const frente = frentes[frenteIndex];
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;

          if (aulaIndex >= frente.aulas.length) {
            frenteIndex++;
            continue;
          }

          if (tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal) {
            itens.push({
              cronograma_id: '',
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++,
            });

            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
            aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
          } else {
            break;
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
      .from('aulas_concluidas')
      .select('aula_id')
      .eq('aluno_id', alunoId)
      .eq('curso_id', cursoId);

    if (error) {
      console.error('[CronogramaService] Erro ao buscar aulas concluídas:', error);
    } else if (data && data.length > 0) {
      return new Set(data.map((row) => row.aula_id as string));
    }

    const { data: historicoData, error: historicoError } = await client
      .from('cronograma_itens')
      .select('aula_id, cronogramas!inner(aluno_id, curso_alvo_id)')
      .eq('concluido', true)
      .eq('cronogramas.aluno_id', alunoId)
      .eq('cronogramas.curso_alvo_id', cursoId);

    if (historicoError) {
      console.error('[CronogramaService] Erro ao buscar histórico de aulas concluídas:', historicoError);
      return new Set();
    }

    return new Set((historicoData ?? []).map((row) => row.aula_id as string));
  }

  private async persistirCronograma(
    client: ReturnType<typeof getDatabaseClient>,
    input: GerarCronogramaInput,
    itens: ItemDistribuicao[],
  ): Promise<any> {
    // Criar registro do cronograma
    const { data: cronograma, error: cronogramaError } = await client
      .from('cronogramas')
      .insert({
        aluno_id: input.aluno_id,
        curso_alvo_id: input.curso_alvo_id || null,
        nome: input.nome || 'Meu Cronograma',
        data_inicio: input.data_inicio,
        data_fim: input.data_fim,
        dias_estudo_semana: input.dias_semana,
        horas_estudo_dia: input.horas_dia,
        periodos_ferias: input.ferias || [],
        prioridade_minima: input.prioridade_minima,
        modalidade_estudo: input.modalidade,
        disciplinas_selecionadas: input.disciplinas_ids,
        ordem_frentes_preferencia: input.ordem_frentes_preferencia || null,
        modulos_selecionados: input.modulos_ids?.length ? input.modulos_ids : null,
        excluir_aulas_concluidas: input.excluir_aulas_concluidas !== false,
        velocidade_reproducao: input.velocidade_reproducao ?? 1.0,
      })
      .select()
      .single();

    if (cronogramaError || !cronograma) {
      console.error('[CronogramaService] Erro ao criar cronograma:', {
        message: cronogramaError?.message,
        details: cronogramaError?.details,
        hint: cronogramaError?.hint,
        code: cronogramaError?.code,
      });
      
      // Se for erro 409 (Conflict), lançar erro específico
      if (cronogramaError?.code === '23505' || cronogramaError?.code === 'PGRST116') {
        throw new CronogramaConflictError(
          `Erro ao criar cronograma: ${cronogramaError.message || 'Conflito ao criar cronograma'}`,
        );
      }
      
      // Se o erro mencionar schema cache, limpar cache e tentar novamente
      if (cronogramaError?.message?.includes('schema cache') || cronogramaError?.message?.includes('Could not find')) {
        console.warn('[CronogramaService] Problema com schema cache detectado, limpando cache...');
        clearDatabaseClientCache();
        // Continuar com fallback abaixo
      }
      
      // Se o erro mencionar schema cache ou coluna não encontrada, tentar sem as colunas novas
      if (cronogramaError?.message?.includes('schema cache') || cronogramaError?.message?.includes('Could not find')) {
        console.warn('[CronogramaService] Problema com schema cache detectado, tentando sem as colunas novas...');
        // Tentar inserir sem as colunas que podem estar causando problema
        const { data: cronogramaFallback, error: fallbackError } = await client
          .from('cronogramas')
          .insert({
            aluno_id: input.aluno_id,
            curso_alvo_id: input.curso_alvo_id || null,
            nome: input.nome || 'Meu Cronograma',
            data_inicio: input.data_inicio,
            data_fim: input.data_fim,
            dias_estudo_semana: input.dias_semana,
            horas_estudo_dia: input.horas_dia,
            periodos_ferias: input.ferias || [],
            prioridade_minima: input.prioridade_minima,
            modalidade_estudo: input.modalidade,
            disciplinas_selecionadas: input.disciplinas_ids,
            ordem_frentes_preferencia: input.ordem_frentes_preferencia || null,
          })
          .select()
          .single();
          
        if (fallbackError || !cronogramaFallback) {
          throw new Error(`Erro ao criar cronograma: ${fallbackError?.message || cronogramaError?.message || 'Desconhecido'}`);
        }
        
        // Atualizar com as colunas novas separadamente
        const { data: cronogramaUpdated, error: updateError } = await client
          .from('cronogramas')
          .update({
            modulos_selecionados: input.modulos_ids?.length ? input.modulos_ids : null,
            excluir_aulas_concluidas: input.excluir_aulas_concluidas !== false,
          })
          .eq('id', cronogramaFallback.id)
          .select()
          .single();
          
        if (updateError) {
          console.warn('[CronogramaService] Não foi possível atualizar campos novos, mas cronograma foi criado');
        }
        
        return cronogramaUpdated || cronogramaFallback;
      }
      
      throw new Error(`Erro ao criar cronograma: ${cronogramaError?.message || 'Desconhecido'}`);
    }

    // Preencher cronograma_id nos itens
    const itensCompleto = itens.map((item) => ({
      ...item,
      cronograma_id: cronograma.id,
    }));

    // Bulk insert dos itens
    const { error: itensError } = await client.from('cronograma_itens').insert(itensCompleto);

    if (itensError) {
      // Tentar deletar o cronograma criado
      await client.from('cronogramas').delete().eq('id', cronograma.id);
      throw new Error(`Erro ao inserir itens do cronograma: ${itensError.message}`);
    }

    // Buscar cronograma completo com itens
    const { data: cronogramaCompleto, error: fetchError } = await client
      .from('cronogramas')
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
      .eq('id', cronograma.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar cronograma completo:', fetchError);
      return cronograma;
    }

    return cronogramaCompleto || cronograma;
  }
}

export const cronogramaService = new CronogramaService();

