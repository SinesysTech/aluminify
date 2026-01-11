import { getDatabaseClient } from '@/backend/clients/database'
import { getServiceRoleClient } from '@/backend/clients/database-auth'
import type {
  DashboardData,
  ModuloImportancia,
  StrategicDomain,
  StrategicDomainRecommendation,
} from '@/types/dashboard'

export class DashboardAnalyticsService {
  /**
   * Busca dados agregados do dashboard para um aluno
   */
  async getDashboardData(
    alunoId: string, 
    period: 'semanal' | 'mensal' | 'anual' = 'anual'
  ): Promise<DashboardData> {
    const client = getDatabaseClient()

    // Buscar dados do usuário
    const user = await this.getUserInfo(alunoId, client)

    // Buscar métricas em paralelo
    const [
      metrics,
      heatmap,
      subjects,
      focusEfficiency,
      strategicDomain,
      subjectDistribution,
    ] = await Promise.all([
      this.getMetrics(alunoId, client),
      this.getHeatmapData(alunoId, client, period),
      this.getSubjectPerformance(alunoId, client),
      this.getFocusEfficiency(alunoId, client),
      this.getStrategicDomain(alunoId, client),
      this.getSubjectDistribution(alunoId, client),
    ])

    return {
      user,
      metrics,
      heatmap,
      subjects,
      focusEfficiency,
      strategicDomain,
      subjectDistribution,
    }
  }

  /**
   * Busca informações do usuário (aluno ou professor)
   */
  private async getUserInfo(alunoId: string, client: ReturnType<typeof getDatabaseClient>) {
    // Buscar dados do usuário autenticado primeiro para obter o email e role
    const { data: authUser } = await client.auth.admin.getUserById(alunoId)
    
    if (!authUser?.user) {
      throw new Error('Usuário não encontrado no sistema de autenticação')
    }

    const userEmail = authUser.user.email || ''
    const userRole = (authUser.user.user_metadata?.role as string) || 'aluno'
    const isProfessor = userRole === 'professor' || userRole === 'superadmin'
    
    // Buscar nome do professor se for professor
    let professorName: string | null = null
    if (isProfessor) {
      const { data: professor } = await client
        .from('professores')
        .select('nome_completo')
        .eq('id', alunoId)
        .maybeSingle()
      
      professorName = professor?.nome_completo || null
    }
    
    // Buscar dados do aluno (professores também precisam ter registro aqui para dados de sessões/progresso)
    const { data: aluno, error: alunoError } = await client
      .from('alunos')
      .select('id, nome_completo, email')
      .eq('id', alunoId)
      .maybeSingle()

    // Se houver erro de RLS ou permissão, tentar com cliente admin
    let alunoFinal = aluno
    if (alunoError && !aluno) {
      console.log('[DashboardAnalytics] Erro ao buscar aluno, tentando com cliente admin:', alunoError.message)
      const adminClient = getServiceRoleClient()
      const { data: alunoAdmin, error: adminError } = await adminClient
        .from('alunos')
        .select('id, nome_completo, email')
        .eq('id', alunoId)
        .maybeSingle()
      
      if (adminError) {
        console.error('[DashboardAnalytics] Erro mesmo com cliente admin:', adminError)
        // Se ainda houver erro, pode ser que o registro realmente não exista
      } else if (alunoAdmin) {
        alunoFinal = alunoAdmin
      }
    }

    // Se o registro não existe, criar um registro básico
    if (!alunoFinal) {
      console.log(`[DashboardAnalytics] Registro não encontrado na tabela alunos para ${isProfessor ? 'professor' : 'aluno'}, criando registro...`)
      
      if (!userEmail) {
        throw new Error('Email do usuário é necessário para criar o registro')
      }

      // Usar nome do professor se disponível, senão usar metadata
      const fullName = professorName || 
                       authUser.user.user_metadata?.full_name || 
                       authUser.user.user_metadata?.name || 
                       userEmail.split('@')[0] || 
                       (isProfessor ? 'Professor' : 'Aluno')

      // Tentar inserir com o cliente normal primeiro (pode funcionar se RLS permitir)
      let insertClient = client
      let insertError = null
      
      const { error: normalInsertError } = await client
        .from('alunos')
        .insert({
          id: alunoId,
          email: userEmail,
          nome_completo: fullName,
        })

      if (normalInsertError) {
        console.log('[DashboardAnalytics] Erro ao inserir com cliente normal, tentando com cliente admin:', normalInsertError.message)
        // Tentar com cliente admin (bypass RLS)
        insertClient = getServiceRoleClient()
        const { error: adminInsertError } = await insertClient
          .from('alunos')
          .insert({
            id: alunoId,
            email: userEmail,
            nome_completo: fullName,
          })
        
        if (adminInsertError) {
          insertError = adminInsertError
        }
      }

      if (insertError) {
        console.error('[DashboardAnalytics] Erro ao criar registro mesmo com cliente admin:', insertError)
        throw new Error(`Erro ao criar registro: ${insertError.message}`)
      }

      console.log('[DashboardAnalytics] Registro criado com sucesso')
      
      // Buscar o registro recém-criado usando o cliente que funcionou
      const { data: novoAluno, error: selectError } = await insertClient
        .from('alunos')
        .select('id, nome_completo, email')
        .eq('id', alunoId)
        .single()

      if (selectError || !novoAluno) {
        throw new Error('Erro ao buscar registro recém-criado')
      }

      // Usar o novo registro
      alunoFinal = novoAluno
      const avatarUrl =
        authUser?.user?.user_metadata?.avatar_url ||
        authUser?.user?.user_metadata?.picture ||
        ''

      // Calcular streak (dias consecutivos com sessões de estudo)
      const streakDays = await this.calculateStreak(alunoId, client)

      // Usar nome do professor se disponível, senão usar o nome do registro
      const displayName = professorName || alunoFinal.nome_completo || alunoFinal.email.split('@')[0] || (isProfessor ? 'Professor' : 'Aluno')

      return {
        name: displayName,
        email: alunoFinal.email,
        avatarUrl,
        streakDays,
      }
    }

    // Buscar avatar do usuário (se existir)
    const avatarUrl =
      authUser?.user?.user_metadata?.avatar_url ||
      authUser?.user?.user_metadata?.picture ||
      ''

    // Calcular streak (dias consecutivos com sessões de estudo)
    const streakDays = await this.calculateStreak(alunoId, client)

    // Usar nome do professor se disponível, senão usar o nome do registro de aluno
    const displayName = professorName || alunoFinal.nome_completo || alunoFinal.email.split('@')[0] || (isProfessor ? 'Professor' : 'Aluno')

    return {
      name: displayName,
      email: alunoFinal.email,
      avatarUrl,
      streakDays,
    }
  }

  /**
   * Calcula dias consecutivos de estudo (streak)
   */
  private async calculateStreak(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('inicio')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .order('inicio', { ascending: false })
      .limit(365)

    if (!sessoes || sessoes.length === 0) return 0

    // Agrupar por data (ignorar hora)
    const diasUnicos = new Set<string>()
    sessoes.forEach((sessao) => {
      const data = new Date(sessao.inicio).toISOString().split('T')[0]
      diasUnicos.add(data)
    })

    // Ordenar datas e calcular streak
    const dias = Array.from(diasUnicos).sort().reverse()
    let streak = 0
    const hoje = new Date().toISOString().split('T')[0]
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Se não estudou hoje, começar de ontem
    let dataEsperada = dias.includes(hoje) ? hoje : ontem

    for (const dia of dias) {
      if (dia === dataEsperada) {
        streak++
        // Calcular próxima data esperada
        const dataEsperadaDate = new Date(dataEsperada)
        dataEsperadaDate.setDate(dataEsperadaDate.getDate() - 1)
        dataEsperada = dataEsperadaDate.toISOString().split('T')[0]
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Busca métricas principais
   */
  private async getMetrics(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ) {
    // Progresso do cronograma (simplificado - pode ser melhorado)
    const scheduleProgress = await this.getScheduleProgress(alunoId, client)

    // Tempo focado (últimos 7 dias)
    const { focusTime, focusTimeDelta } = await this.getFocusTime(alunoId, client)

    // Questões feitas (esta semana)
    const { questionsAnswered, period } = await this.getQuestionsAnswered(
      alunoId,
      client
    )

    // Aproveitamento médio
    const accuracy = await this.getAccuracy(alunoId, client)

    // Flashcards revisados
    const flashcardsReviewed = await this.getFlashcardsReviewed(alunoId, client)

    return {
      scheduleProgress,
      focusTime,
      focusTimeDelta,
      questionsAnswered,
      questionsAnsweredPeriod: period,
      accuracy,
      flashcardsReviewed,
    }
  }

  /**
   * Calcula progresso do cronograma
   * Considera aulas concluídas (cronograma_itens.concluido) para evitar duplicação
   * Não conta tempo_estudos_concluido separadamente para não duplicar
   * 
   * Usa a mesma lógica das páginas de calendário e cronograma: busca o cronograma mais recente
   */
  private async getScheduleProgress(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    // Buscar cronograma mais recente do aluno (mesma lógica das páginas de calendário e cronograma)
    // Não filtra por 'ativo' pois esse campo pode não existir ou não estar definido
    const { data: cronograma } = await client
      .from('cronogramas')
      .select('id')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!cronograma) return 0

    // Buscar total de itens (aulas) no cronograma
    const { data: itens, error: itensError } = await client
      .from('cronograma_itens')
      .select('id, concluido')
      .eq('cronograma_id', cronograma.id)

    if (itensError || !itens || itens.length === 0) return 0

    // Contar aulas concluídas (mesma lógica do calendário)
    const totalAulas = itens.length
    const aulasConcluidas = itens.filter((item) => item.concluido === true).length

    // Calcular percentual baseado em aulas concluídas
    // Isso evita duplicação pois conta cada aula apenas uma vez
    // Usa a mesma fórmula do calendário: (concluídas / total) * 100
    return totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0
  }

  /**
   * Calcula tempo focado e delta
   */
  private async getFocusTime(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<{ focusTime: string; focusTimeDelta: string }> {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - 7)

    // Tempo desta semana
    const { data: sessoesSemana } = await client
      .from('sessoes_estudo')
      .select('tempo_total_liquido_segundos')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .gte('inicio', inicioSemana.toISOString())

    const tempoSemana =
      sessoesSemana?.reduce(
        (acc, s) => acc + (s.tempo_total_liquido_segundos || 0),
        0
      ) || 0

    // Tempo da semana anterior
    const inicioSemanaAnterior = new Date(inicioSemana)
    inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7)

    const { data: sessoesSemanaAnterior } = await client
      .from('sessoes_estudo')
      .select('tempo_total_liquido_segundos')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .gte('inicio', inicioSemanaAnterior.toISOString())
      .lt('inicio', inicioSemana.toISOString())

    const tempoSemanaAnterior =
      sessoesSemanaAnterior?.reduce(
        (acc, s) => acc + (s.tempo_total_liquido_segundos || 0),
        0
      ) || 0

    // Formatar tempo
    const horas = Math.floor(tempoSemana / 3600)
    const minutos = Math.floor((tempoSemana % 3600) / 60)
    const focusTime = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`

    // Calcular delta
    const delta = tempoSemana - tempoSemanaAnterior
    const deltaHoras = Math.abs(Math.floor(delta / 3600))
    const deltaMinutos = Math.abs(Math.floor((delta % 3600) / 60))
    const deltaFormatted =
      deltaHoras > 0 ? `${deltaHoras}h` : `${deltaMinutos}m`
    const focusTimeDelta = delta >= 0 ? `+${deltaFormatted}` : `-${deltaFormatted}`

    return { focusTime, focusTimeDelta }
  }

  /**
   * Conta questões feitas
   */
  private async getQuestionsAnswered(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<{ questionsAnswered: number; period: string }> {
    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - 7)

    const { data: progressos } = await client
      .from('progresso_atividades')
      .select('questoes_totais')
      .eq('aluno_id', alunoId)
      .eq('status', 'Concluido')
      .gte('data_conclusao', inicioSemana.toISOString())

    const total =
      progressos?.reduce((acc, p) => acc + (p.questoes_totais || 0), 0) || 0

    return {
      questionsAnswered: total,
      period: 'Essa semana',
    }
  }

  /**
   * Calcula aproveitamento médio
   */
  private async getAccuracy(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    const { data: progressos } = await client
      .from('progresso_atividades')
      .select('questoes_totais, questoes_acertos')
      .eq('aluno_id', alunoId)
      .eq('status', 'Concluido')
      .not('questoes_totais', 'is', null)
      .gt('questoes_totais', 0)

    if (!progressos || progressos.length === 0) return 0

    let totalQuestoes = 0
    let totalAcertos = 0

    progressos.forEach((p) => {
      totalQuestoes += p.questoes_totais || 0
      totalAcertos += p.questoes_acertos || 0
    })

    return totalQuestoes > 0
      ? Math.round((totalAcertos / totalQuestoes) * 100)
      : 0
  }

  /**
   * Conta flashcards revisados
   */
  private async getFlashcardsReviewed(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    // Buscar flashcards revisados diretamente da tabela progresso_flashcards
    // Cada registro nesta tabela representa um flashcard que foi revisado pelo aluno
    // (mesmo que tenha sido revisado múltiplas vezes, cada flashcard_id único conta como 1)
    const { data: progressosFlashcards, error } = await client
      .from('progresso_flashcards')
      .select('flashcard_id')
      .eq('aluno_id', alunoId)

    if (error) {
      console.error('[dashboard-analytics] Erro ao buscar flashcards revisados:', error)
      return 0
    }

    if (!progressosFlashcards || progressosFlashcards.length === 0) {
      return 0
    }

    // Contar flashcards únicos (um flashcard pode ter múltiplas revisões)
    const flashcardsUnicos = new Set(progressosFlashcards.map((p: { flashcard_id: string }) => p.flashcard_id))
    return flashcardsUnicos.size
  }

  /**
   * Gera dados do heatmap (365 dias)
   */
  private async getHeatmapData(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
    period: 'semanal' | 'mensal' | 'anual' = 'anual'
  ) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia
    
    let inicioPeriodo: Date
    let dias: number

    // Calcular período baseado no parâmetro
    switch (period) {
      case 'semanal':
        inicioPeriodo = new Date(hoje)
        inicioPeriodo.setDate(hoje.getDate() - 7)
        dias = 7
        break
      case 'mensal':
        inicioPeriodo = new Date(hoje)
        inicioPeriodo.setDate(hoje.getDate() - 31)
        dias = 31
        break
      case 'anual':
      default:
        inicioPeriodo = new Date(hoje)
        inicioPeriodo.setDate(hoje.getDate() - 365)
        dias = 365
        break
    }

    // Buscar sessões do período
    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('inicio, tempo_total_liquido_segundos')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .gte('inicio', inicioPeriodo.toISOString())

    // Criar mapa de dias
    const diasMap = new Map<string, number>()

    sessoes?.forEach((sessao) => {
      const data = new Date(sessao.inicio).toISOString().split('T')[0]
      const minutos = Math.floor((sessao.tempo_total_liquido_segundos || 0) / 60)
      const atual = diasMap.get(data) || 0
      diasMap.set(data, atual + minutos)
    })

    // Gerar array de dias
    const heatmap: Array<{ date: string; intensity: number }> = []
    for (let i = 0; i < dias; i++) {
      const data = new Date(inicioPeriodo)
      data.setDate(inicioPeriodo.getDate() + i)
      const dataStr = data.toISOString().split('T')[0]

      const minutos = diasMap.get(dataStr) || 0
      // Classificar intensidade: 0-30min=1, 30-60min=2, 60-120min=3, >120min=4
      let intensity = 0
      if (minutos > 0) {
        if (minutos < 30) intensity = 1
        else if (minutos < 60) intensity = 2
        else if (minutos < 120) intensity = 3
        else intensity = 4
      }

      heatmap.push({ date: dataStr, intensity })
    }

    return heatmap
  }

  /**
   * Calcula performance por disciplina/frente
   * Retorna todas as frentes dos cursos do aluno, mesmo sem progresso
   */
  private async getSubjectPerformance(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ) {
    // 1. Buscar cursos do aluno (ou todos se for professor)
    const { data: professorData } = await client
      .from('professores')
      .select('id')
      .eq('id', alunoId)
      .maybeSingle();
    
    const isProfessor = !!professorData;
    let cursoIds: string[] = [];
    
    if (isProfessor) {
      // Professores: buscar todos os cursos
      const { data: todosCursos } = await client
        .from('cursos')
        .select('id');
      cursoIds = (todosCursos ?? []).map((c: { id: string }) => c.id);
    } else {
      // Alunos: buscar cursos matriculados
      const { data: alunosCursos } = await client
        .from('alunos_cursos')
        .select('curso_id')
        .eq('aluno_id', alunoId);
      cursoIds = (alunosCursos ?? []).map((ac: { curso_id: string }) => ac.curso_id);
    }
    
    if (cursoIds.length === 0) return [];

    // 2. Buscar disciplinas dos cursos
    const { data: cursosDisciplinas } = await client
      .from('cursos_disciplinas')
      .select('disciplina_id, curso_id')
      .in('curso_id', cursoIds);

    if (!cursosDisciplinas || cursosDisciplinas.length === 0) return [];

    const disciplinaIds = [...new Set(cursosDisciplinas.map((cd: { disciplina_id: string }) => cd.disciplina_id))];

    // 3. Buscar TODAS as frentes dessas disciplinas (mesmo sem progresso)
    const { data: todasFrentes } = await client
      .from('frentes')
      .select('id, nome, disciplina_id, curso_id')
      .in('disciplina_id', disciplinaIds)
      .or(
        cursoIds.map((cid) => `curso_id.eq.${cid}`).join(',') +
        (cursoIds.length > 0 ? ',' : '') +
        'curso_id.is.null',
      );

    if (!todasFrentes || todasFrentes.length === 0) return [];

    // Filtrar frentes que pertencem aos cursos ou são globais
    const frentesFiltradas = todasFrentes.filter(
      (f) => !f.curso_id || cursoIds.includes(f.curso_id),
    );

    // 4. Buscar disciplinas
    const disciplinaIdsFrentes = [...new Set(frentesFiltradas.map((f) => f.disciplina_id).filter(Boolean))];
    const { data: disciplinas } = await client
      .from('disciplinas')
      .select('id, nome')
      .in('id', disciplinaIdsFrentes);

    const disciplinaMap = new Map(disciplinas?.map((d) => [d.id, d]) || []);

    // 5. Buscar progressos com questões (se houver)
    const { data: progressos } = await client
      .from('progresso_atividades')
      .select(
        `
        questoes_totais,
        questoes_acertos,
        atividade_id
      `
      )
      .eq('aluno_id', alunoId)
      .eq('status', 'Concluido')
      .not('questoes_totais', 'is', null)
      .gt('questoes_totais', 0);

    // 6. Se houver progressos, calcular performance por frente
    const performanceMap = new Map<
      string,
      { total: number; acertos: number; disciplina: string; frente: string }
    >();

    if (progressos && progressos.length > 0) {
      // Buscar atividades
      const atividadeIds = progressos.map((p) => p.atividade_id);
      const { data: atividades } = await client
        .from('atividades')
        .select('id, modulo_id')
        .in('id', atividadeIds);

      if (atividades && atividades.length > 0) {
        // Buscar módulos
        const moduloIds = [...new Set(atividades.map((a) => a.modulo_id).filter(Boolean))];
        const { data: modulos } = await client
          .from('modulos')
          .select('id, frente_id')
          .in('id', moduloIds);

        if (modulos && modulos.length > 0) {
          // Criar mapas para lookup
          const atividadeModuloMap = new Map(atividades.map((a) => [a.id, a.modulo_id]));
          const moduloFrenteMap = new Map(modulos.map((m) => [m.id, m.frente_id]));
          const progressoMap = new Map(
            progressos.map((p) => [p.atividade_id, p])
          );

          // Agrupar por disciplina/frente
          atividades.forEach((atividade) => {
            const progresso = progressoMap.get(atividade.id);
            if (!progresso) return;

            const moduloId = atividadeModuloMap.get(atividade.id);
            if (!moduloId) return;

            const frenteId = moduloFrenteMap.get(moduloId);
            if (!frenteId) return;

            const frente = frentesFiltradas.find((f) => f.id === frenteId);
            if (!frente) return;

            const disciplina = disciplinaMap.get(frente.disciplina_id || '');
            if (!disciplina) return;

            const key = `${disciplina.id}-${frente.id}`;
            const atual = performanceMap.get(key) || {
              total: 0,
              acertos: 0,
              disciplina: disciplina.nome,
              frente: frente.nome,
            };

            atual.total += progresso.questoes_totais || 0;
            atual.acertos += progresso.questoes_acertos || 0;
            performanceMap.set(key, atual);
          });
        }
      }
    }

    // 7. Criar lista final: todas as frentes, com ou sem progresso
    const subjects = frentesFiltradas.map((frente, index) => {
      const disciplina = disciplinaMap.get(frente.disciplina_id || '');
      if (!disciplina) return null;

      const key = `${disciplina.id}-${frente.id}`;
      const performance = performanceMap.get(key);

      if (performance) {
        // Frente com progresso: calcular score
        const score =
          performance.total > 0
            ? Math.round((performance.acertos / performance.total) * 100)
            : 0;
        return {
          id: index + 1,
          name: disciplina.nome,
          front: frente.nome,
          score,
          isNotStarted: false,
        };
      } else {
        // Frente sem progresso: score 0 e status "Não iniciada"
        return {
          id: index + 1,
          name: disciplina.nome,
          front: frente.nome,
          score: 0,
          isNotStarted: true,
        };
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    return subjects;
  }

  /**
   * Calcula eficiência de foco por dia da semana
   */
  private async getFocusEfficiency(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ) {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - 7)

    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('inicio, tempo_total_bruto_segundos, tempo_total_liquido_segundos')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .gte('inicio', inicioSemana.toISOString())

    // Agrupar por dia da semana
    const diasMap = new Map<
      number,
      { bruto: number; liquido: number }
    >()

    sessoes?.forEach((sessao) => {
      const data = new Date(sessao.inicio)
      const diaSemana = data.getDay() // 0 = domingo, 1 = segunda, etc.
      const atual = diasMap.get(diaSemana) || { bruto: 0, liquido: 0 }

      atual.bruto += sessao.tempo_total_bruto_segundos || 0
      atual.liquido += sessao.tempo_total_liquido_segundos || 0
      diasMap.set(diaSemana, atual)
    })

    // Converter para formato esperado (Segunda = 1, Domingo = 0)
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const efficiency = []

    // Segunda a Domingo
    for (let i = 1; i <= 7; i++) {
      const diaIndex = i === 7 ? 0 : i // Domingo é 0
      const data = diasMap.get(diaIndex) || { bruto: 0, liquido: 0 }

      efficiency.push({
        day: diasSemana[diaIndex],
        grossTime: Math.floor(data.bruto / 60), // minutos
        netTime: Math.floor(data.liquido / 60), // minutos
      })
    }

    return efficiency
  }

  /**
   * Calcula domínio estratégico
   */
  private async getStrategicDomain(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<StrategicDomain> {
    const empty: StrategicDomain = {
      baseModules: { flashcardsScore: null, questionsScore: null },
      highRecurrence: { flashcardsScore: null, questionsScore: null },
      recommendations: [],
    }

    const chunk = <T,>(arr: T[], size: number): T[][] => {
      if (arr.length === 0) return []
      const out: T[][] = []
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
      return out
    }

    const roundPercentFromAvgFeedback = (sum: number, count: number) => {
      if (count <= 0) return null
      // avg(feedback) é 1..4 → converter para 0..100
      return Math.round((sum / count / 4) * 100)
    }

    const roundPercentFromRatio = (num: number, den: number) => {
      if (den <= 0) return null
      return Math.round((num / den) * 100)
    }

    // 1) Resolver cursos do usuário (mesma lógica de getSubjectPerformance)
    const { data: professorData } = await client
      .from('professores')
      .select('id')
      .eq('id', alunoId)
      .maybeSingle()

    const isProfessor = !!professorData
    let cursoIds: string[] = []

    if (isProfessor) {
      const { data: todosCursos } = await client.from('cursos').select('id')
      cursoIds = (todosCursos ?? []).map((c: { id: string }) => c.id)
    } else {
      const { data: alunosCursos } = await client
        .from('alunos_cursos')
        .select('curso_id')
        .eq('aluno_id', alunoId)
      cursoIds = (alunosCursos ?? []).map((ac: { curso_id: string }) => ac.curso_id)
    }

    if (cursoIds.length === 0) return empty

    // 2) Disciplinas dos cursos
    const { data: cursosDisciplinas } = await client
      .from('cursos_disciplinas')
      .select('disciplina_id, curso_id')
      .in('curso_id', cursoIds)

    if (!cursosDisciplinas || cursosDisciplinas.length === 0) return empty

    const disciplinaIds = [
      ...new Set(cursosDisciplinas.map((cd: { disciplina_id: string }) => cd.disciplina_id)),
    ]

    // 3) Frentes das disciplinas (curso_id do curso ou null)
    const { data: todasFrentes } = await client
      .from('frentes')
      .select('id, disciplina_id, curso_id')
      .in('disciplina_id', disciplinaIds)
      .or(
        cursoIds.map((cid) => `curso_id.eq.${cid}`).join(',') +
          (cursoIds.length > 0 ? ',' : '') +
          'curso_id.is.null',
      )

    const frentesFiltradas = (todasFrentes ?? []).filter(
      (f: { curso_id: string | null }) => !f.curso_id || cursoIds.includes(f.curso_id),
    )

    if (frentesFiltradas.length === 0) return empty

    const frenteIds = frentesFiltradas.map((f: { id: string }) => f.id)

    // 4) Módulos das frentes (curso_id do curso ou null)
    const { data: todosModulos } = await client
      .from('modulos')
      .select('id, nome, importancia, frente_id, curso_id')
      .in('frente_id', frenteIds)
      .or(
        cursoIds.map((cid) => `curso_id.eq.${cid}`).join(',') +
          (cursoIds.length > 0 ? ',' : '') +
          'curso_id.is.null',
      )

    const modulosFiltrados = (todosModulos ?? []).filter(
      (m: { curso_id: string | null }) => !m.curso_id || cursoIds.includes(m.curso_id),
    )

    if (modulosFiltrados.length === 0) return empty

    const modulosById = new Map(
      modulosFiltrados.map((m: { id: string; nome: string; importancia: ModuloImportancia | null }) => [
        m.id,
        {
          id: m.id,
          nome: m.nome,
          importancia: (m.importancia ?? 'Media') as ModuloImportancia,
        },
      ]),
    )

    const baseModuleIds = modulosFiltrados
      .filter((m: { importancia: ModuloImportancia | null }) => m.importancia === 'Base')
      .map((m: { id: string }) => m.id)

    const highRecurrenceModuleIds = modulosFiltrados
      .filter((m: { importancia: ModuloImportancia | null }) => m.importancia === 'Alta')
      .map((m: { id: string }) => m.id)

    const strategicModuleIds = [...new Set([...baseModuleIds, ...highRecurrenceModuleIds])]
    if (strategicModuleIds.length === 0) return empty

    // 5) Flashcards (memória): mapear flashcard_id -> modulo_id e agregar feedback
    const flashcardIdToModuloId = new Map<string, string>()
    const flashAggByModulo = new Map<string, { sum: number; count: number }>()

    const { data: flashcardsRows } = await client
      .from('flashcards')
      .select('id, modulo_id')
      .in('modulo_id', strategicModuleIds)

    const flashcardIds = (flashcardsRows ?? [])
      .map((f: { id: string; modulo_id: string | null }) => {
        if (f.modulo_id) flashcardIdToModuloId.set(f.id, f.modulo_id)
        return f.id
      })
      .filter(Boolean)

    if (flashcardIds.length > 0) {
      const progressosFlashcards: Array<{ flashcard_id: string; ultimo_feedback: number | null }> = []

      for (const idsChunk of chunk(flashcardIds, 900)) {
        const { data: progChunk, error: progErr } = await client
          .from('progresso_flashcards')
          .select('flashcard_id, ultimo_feedback')
          .eq('aluno_id', alunoId)
          .in('flashcard_id', idsChunk)
          .not('ultimo_feedback', 'is', null)

        if (progErr) {
          console.error('[dashboard-analytics] Erro ao buscar progresso_flashcards:', progErr)
          continue
        }

        progressosFlashcards.push(...((progChunk as Array<{ flashcard_id: string; ultimo_feedback: number | null }>) ?? []))
      }

      for (const p of progressosFlashcards) {
        const moduloId = flashcardIdToModuloId.get(p.flashcard_id)
        const feedback = p.ultimo_feedback
        if (!moduloId || feedback == null) continue
        if (feedback < 1 || feedback > 4) continue

        const curr = flashAggByModulo.get(moduloId) || { sum: 0, count: 0 }
        curr.sum += feedback
        curr.count += 1
        flashAggByModulo.set(moduloId, curr)
      }
    }

    // 6) Questões (aplicação): progresso_atividades -> atividades(modulo_id)
    const questionsAggByModulo = new Map<string, { acertos: number; totais: number }>()

    const { data: progressosAtividades, error: progAtvError } = await client
      .from('progresso_atividades')
      .select('atividade_id, questoes_totais, questoes_acertos')
      .eq('aluno_id', alunoId)
      .eq('status', 'Concluido')
      .not('questoes_totais', 'is', null)
      .gt('questoes_totais', 0)

    if (progAtvError) {
      console.error('[dashboard-analytics] Erro ao buscar progresso_atividades:', progAtvError)
    }

    const atividadeIds = [...new Set((progressosAtividades ?? []).map((p: { atividade_id: string }) => p.atividade_id))]
    const atividadeIdToModuloId = new Map<string, string>()

    for (const idsChunk of chunk(atividadeIds, 900)) {
      const { data: atividadesChunk, error: atvErr } = await client
        .from('atividades')
        .select('id, modulo_id')
        .in('id', idsChunk)

      if (atvErr) {
        console.error('[dashboard-analytics] Erro ao buscar atividades:', atvErr)
        continue
      }

      for (const a of (atividadesChunk ?? []) as Array<{ id: string; modulo_id: string | null }>) {
        if (a.modulo_id) atividadeIdToModuloId.set(a.id, a.modulo_id)
      }
    }

    for (const p of (progressosAtividades ?? []) as Array<{
      atividade_id: string
      questoes_totais: number | null
      questoes_acertos: number | null
    }>) {
      const moduloId = atividadeIdToModuloId.get(p.atividade_id)
      if (!moduloId) continue
      if (!strategicModuleIds.includes(moduloId)) continue

      const totais = p.questoes_totais ?? 0
      const acertos = p.questoes_acertos ?? 0
      if (totais <= 0) continue

      const curr = questionsAggByModulo.get(moduloId) || { acertos: 0, totais: 0 }
      curr.acertos += acertos
      curr.totais += totais
      questionsAggByModulo.set(moduloId, curr)
    }

    const axisFlashcardsScore = (moduleIds: string[]) => {
      let sum = 0
      let count = 0
      for (const id of moduleIds) {
        const agg = flashAggByModulo.get(id)
        if (!agg) continue
        sum += agg.sum
        count += agg.count
      }
      return roundPercentFromAvgFeedback(sum, count)
    }

    const axisQuestionsScore = (moduleIds: string[]) => {
      let acertos = 0
      let totais = 0
      for (const id of moduleIds) {
        const agg = questionsAggByModulo.get(id)
        if (!agg) continue
        acertos += agg.acertos
        totais += agg.totais
      }
      return roundPercentFromRatio(acertos, totais)
    }

    const moduleFlashcardsScore = (moduleId: string) => {
      const agg = flashAggByModulo.get(moduleId)
      if (!agg) return null
      return roundPercentFromAvgFeedback(agg.sum, agg.count)
    }

    const moduleQuestionsScore = (moduleId: string) => {
      const agg = questionsAggByModulo.get(moduleId)
      if (!agg) return null
      return roundPercentFromRatio(agg.acertos, agg.totais)
    }

    const buildReason = (flash: number | null, questions: number | null) => {
      if (flash != null && questions != null && Math.abs(flash - questions) >= 25) {
        return 'Gap entre memória e aplicação'
      }

      const threshold = 70
      if (questions == null || (flash != null && flash <= (questions ?? 999))) {
        return flash != null && flash < threshold
          ? 'Flashcards baixos (recall fraco)'
          : 'Flashcards com inconsistência'
      }

      return questions < threshold ? 'Acurácia baixa em questões' : 'Questões com inconsistência'
    }

    const importanceOrder: Record<ModuloImportancia, number> = {
      Alta: 0,
      Base: 1,
      Media: 2,
      Baixa: 3,
    }

    type RecommendationWithRisk = StrategicDomainRecommendation & { risk: number }

    const recommendationsWithRisk: RecommendationWithRisk[] = []

    for (const moduloId of strategicModuleIds) {
      const modulo = modulosById.get(moduloId)
      if (!modulo) continue

      const flash = moduleFlashcardsScore(moduloId)
      const questions = moduleQuestionsScore(moduloId)
      const risk =
        flash != null && questions != null ? Math.min(flash, questions) : (flash ?? questions)

      if (risk == null) continue

      recommendationsWithRisk.push({
        moduloId,
        moduloNome: modulo.nome,
        importancia: modulo.importancia,
        flashcardsScore: flash,
        questionsScore: questions,
        reason: buildReason(flash, questions),
        risk,
      })
    }

    const recommendations: StrategicDomainRecommendation[] = recommendationsWithRisk
      .sort((a, b) => {
        if (a.risk !== b.risk) return a.risk - b.risk
        const ia = importanceOrder[a.importancia] ?? 99
        const ib = importanceOrder[b.importancia] ?? 99
        return ia - ib
      })
      .slice(0, 3)
      .map(({ risk: _risk, ...r }) => r)

    return {
      baseModules: {
        flashcardsScore: axisFlashcardsScore(baseModuleIds),
        questionsScore: axisQuestionsScore(baseModuleIds),
      },
      highRecurrence: {
        flashcardsScore: axisFlashcardsScore(highRecurrenceModuleIds),
        questionsScore: axisQuestionsScore(highRecurrenceModuleIds),
      },
      recommendations,
    }
  }

  /**
   * Calcula distribuição por disciplina
   */
  private async getSubjectDistribution(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ) {
    const hoje = new Date()
    const inicioMes = new Date(hoje)
    inicioMes.setMonth(hoje.getMonth() - 1)

    // Buscar sessões do último mês
    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('tempo_total_liquido_segundos, disciplina_id')
      .eq('aluno_id', alunoId)
      .eq('status', 'concluido')
      .gte('inicio', inicioMes.toISOString())
      .not('disciplina_id', 'is', null)

    if (!sessoes || sessoes.length === 0) {
      return [
        { name: 'Física', percentage: 40, color: '#60a5fa' },
        { name: 'Matemática', percentage: 30, color: '#a78bfa' },
        { name: 'História', percentage: 20, color: '#facc15' },
        { name: 'Outros', percentage: 10, color: '#9ca3af' },
      ]
    }

    // Agrupar por disciplina
    const disciplinaMap = new Map<string, number>()

    sessoes.forEach((s) => {
      if (!s.disciplina_id) return

      const atual = disciplinaMap.get(s.disciplina_id) || 0
      disciplinaMap.set(
        s.disciplina_id,
        atual + (s.tempo_total_liquido_segundos || 0)
      )
    })

    // Calcular totais e percentuais
    const total = Array.from(disciplinaMap.values()).reduce(
      (acc, val) => acc + val,
      0
    )

    if (total === 0) {
      return [
        { name: 'Física', percentage: 40, color: '#60a5fa' },
        { name: 'Matemática', percentage: 30, color: '#a78bfa' },
        { name: 'História', percentage: 20, color: '#facc15' },
        { name: 'Outros', percentage: 10, color: '#9ca3af' },
      ]
    }

    // Buscar nomes das disciplinas
    const disciplinasIds = Array.from(disciplinaMap.keys())
    const { data: disciplinas } = await client
      .from('disciplinas')
      .select('id, nome')
      .in('id', disciplinasIds)

    const cores = ['#60a5fa', '#a78bfa', '#facc15', '#9ca3af', '#f87171']
    let corIndex = 0

    const distribution = Array.from(disciplinaMap.entries())
      .map(([id, segundos]) => {
        const disciplina = disciplinas?.find((d) => d.id === id)
        const percentage = Math.round((segundos / total) * 100)

        return {
          name: disciplina?.nome || 'Desconhecida',
          percentage,
          color: cores[corIndex++ % cores.length],
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4) // Top 4

    // Se houver mais disciplinas, agrupar como "Outros"
    if (disciplinaMap.size > 4) {
      const outrosTotal = Array.from(disciplinaMap.entries())
        .slice(4)
        .reduce((acc, [, segundos]) => acc + segundos, 0)
      const outrosPercentage = Math.round((outrosTotal / total) * 100)

      if (outrosPercentage > 0) {
        distribution.push({
          name: 'Outros',
          percentage: outrosPercentage,
          color: cores[corIndex % cores.length],
        })
      }
    }

    return distribution
  }
}

