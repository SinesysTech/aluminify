import { getDatabaseClient } from "@/app/shared/core/database/database";
import type {
  InstitutionDashboardData,
  InstitutionSummary,
  InstitutionEngagement,
  StudentRankingItem,
  ProfessorRankingItem,
  DisciplinaPerformance,
} from "@/app/[tenant]/(modules)/dashboard/types";
import type { HeatmapDay } from "@/app/[tenant]/(modules)/dashboard/types/student";

type DashboardPeriod = "semanal" | "mensal" | "anual";

export class InstitutionAnalyticsService {
  /**
   * Busca IDs de usuários de uma empresa filtrados por papel_base.
   * Usa a tabela usuarios_empresas que possui enum_papel_base (aluno | professor | usuario).
   */
  private async getUserIdsByRole(
    empresaId: string,
    papelBase: "aluno" | "professor" | "usuario",
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<string[]> {
    const { data } = await client
      .from("usuarios_empresas")
      .select("usuario_id")
      .eq("empresa_id", empresaId)
      .eq("papel_base", papelBase)
      .eq("ativo", true)
      .is("deleted_at", null);

    return (data ?? []).map((r) => r.usuario_id);
  }

  /**
   * Conta usuários de uma empresa filtrados por papel_base.
   */
  private async countUsersByRole(
    empresaId: string,
    papelBase: "aluno" | "professor" | "usuario",
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    const { count } = await client
      .from("usuarios_empresas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("papel_base", papelBase)
      .eq("ativo", true)
      .is("deleted_at", null);

    return count ?? 0;
  }

  /**
   * Busca dados agregados do dashboard da instituição
   */
  async getInstitutionDashboard(
    empresaId: string,
    period: DashboardPeriod = "mensal",
    userId?: string,
  ): Promise<InstitutionDashboardData> {
    const client = getDatabaseClient();

    // Fetch user IDs by role ONCE
    const [alunoIds, professorIds] = await Promise.all([
      this.getUserIdsByRole(empresaId, "aluno", client),
      this.getUserIdsByRole(empresaId, "professor", client),
    ]);

    // Buscar nome da empresa
    const { data: empresa } = await client
      .from("empresas")
      .select("nome")
      .eq("id", empresaId)
      .single();

    const empresaNome = empresa?.nome ?? "Instituição";

    // Buscar nome do usuário (primeiro nome)
    let userName = "Usuário";
    if (userId) {
      const { data: usuario } = await client
        .from("usuarios")
        .select("nome_completo")
        .eq("id", userId)
        .maybeSingle();

      if (usuario?.nome_completo) {
        // Extrair primeiro nome
        userName = usuario.nome_completo.split(" ")[0];
      }
    }

    // Buscar métricas em paralelo
    const [
      summary,
      engagement,
      heatmap,
      rankingAlunos,
      rankingProfessores,
      performanceByDisciplina,
    ] = await Promise.all([
      this.getSummary(empresaId, client, alunoIds, professorIds),
      this.getEngagement(empresaId, client, period, alunoIds),
      this.getHeatmapData(empresaId, client, period, alunoIds),
      this.getStudentRanking(empresaId, client, 10, alunoIds),
      this.getProfessorRanking(empresaId, client, 10, professorIds),
      this.getPerformanceByDisciplina(empresaId, client, alunoIds),
    ]);

    return {
      empresaNome,
      userName,
      summary,
      engagement,
      heatmap,
      rankingAlunos,
      rankingProfessores,
      performanceByDisciplina,
    };
  }

  /**
   * Busca resumo geral da instituição
   */
  private async getSummary(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    alunoIds: string[],
    professorIds: string[],
  ): Promise<InstitutionSummary> {
    // Buscar total de cursos
    const { count: totalCursos } = await client
      .from("cursos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId);

    // Alunos ativos (com alguma atividade nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let alunosAtivos = 0;
    if (alunoIds.length > 0) {
      const { data: alunosSessoes } = await client
        .from("sessoes_estudo")
        .select("usuario_id")
        .in("usuario_id", alunoIds)
        .gte("created_at", thirtyDaysAgo.toISOString());

      const alunosComAtividade = new Set(
        (alunosSessoes ?? [])
          .filter((s): s is { usuario_id: string } => s.usuario_id !== null)
          .map((s) => s.usuario_id),
      );
      alunosAtivos = alunosComAtividade.size;
    }

    return {
      totalAlunos: alunoIds.length,
      totalProfessores: professorIds.length,
      totalCursos: totalCursos ?? 0,
      alunosAtivos,
    };
  }

  /**
   * Busca métricas de engajamento
   */
  private async getEngagement(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    period: DashboardPeriod,
    alunoIds: string[],
  ): Promise<InstitutionEngagement> {
    const { startDate, previousStartDate, previousEndDate } =
      this.getPeriodDates(period);

    if (alunoIds.length === 0) {
      return {
        totalHorasEstudo: "0h 0m",
        horasEstudoDelta: "+0h",
        atividadesConcluidas: 0,
        taxaConclusao: 0,
      };
    }

    // Tempo de estudo atual
    const { data: sessoesAtuais } = await client
      .from("sessoes_estudo")
      .select("tempo_total_liquido_segundos")
      .in("usuario_id", alunoIds)
      .gte("created_at", startDate.toISOString());

    const segundosAtuais = (sessoesAtuais ?? []).reduce(
      (acc: number, s: { tempo_total_liquido_segundos: number | null }) =>
        acc + (s.tempo_total_liquido_segundos ?? 0),
      0,
    );

    // Tempo de estudo período anterior
    const { data: sessoesAnteriores } = await client
      .from("sessoes_estudo")
      .select("tempo_total_liquido_segundos")
      .in("usuario_id", alunoIds)
      .gte("created_at", previousStartDate.toISOString())
      .lt("created_at", previousEndDate.toISOString());

    const segundosAnteriores = (sessoesAnteriores ?? []).reduce(
      (acc: number, s: { tempo_total_liquido_segundos: number | null }) =>
        acc + (s.tempo_total_liquido_segundos ?? 0),
      0,
    );

    const horasAtuais = Math.floor(segundosAtuais / 3600);
    const minutosAtuais = Math.floor((segundosAtuais % 3600) / 60);
    const deltaHoras = Math.round((segundosAtuais - segundosAnteriores) / 3600);

    // Atividades concluídas (cronograma_itens com aula_assistida = true)
    const cronogramaIds = await this.getCronogramaIdsByAlunos(alunoIds, client);

    // Check if any cronogramas exist before querying items
    if (cronogramaIds.length === 0) {
        return {
          totalHorasEstudo: `${horasAtuais}h ${minutosAtuais}m`,
          horasEstudoDelta: deltaHoras >= 0 ? `+${deltaHoras}h` : `${deltaHoras}h`,
          atividadesConcluidas: 0,
          taxaConclusao: 0,
        };
    }

    const { count: atividadesConcluidas } = await client
      .from("cronograma_itens")
      .select("id", { count: "exact", head: true })
      .in("cronograma_id", cronogramaIds)
      .eq("aula_assistida", true)
      .gte("updated_at", startDate.toISOString());

    // Taxa de conclusão
    const { count: totalItens } = await client
      .from("cronograma_itens")
      .select("id", { count: "exact", head: true })
      .in("cronograma_id", cronogramaIds);

    const taxaConclusao =
      totalItens && totalItens > 0
        ? Math.round(((atividadesConcluidas ?? 0) / totalItens) * 100)
        : 0;

    return {
      totalHorasEstudo: `${horasAtuais}h ${minutosAtuais}m`,
      horasEstudoDelta: deltaHoras >= 0 ? `+${deltaHoras}h` : `${deltaHoras}h`,
      atividadesConcluidas: atividadesConcluidas ?? 0,
      taxaConclusao,
    };
  }

  /**
   * Helper para obter IDs dos cronogramas dos alunos
   */
  private async getCronogramaIdsByAlunos(
    alunoIds: string[],
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<string[]> {
    if (alunoIds.length === 0) return [];

    const { data: cronogramas } = await client
      .from("cronogramas")
      .select("id")
      .in("usuario_id", alunoIds);

    return (cronogramas ?? []).map((c: { id: string }) => c.id);
  }

  /**
   * Busca dados do heatmap institucional
   */
  private async getHeatmapData(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    period: DashboardPeriod,
    alunoIds: string[],
  ): Promise<HeatmapDay[]> {
    const { startDate } = this.getPeriodDates(period);

    if (alunoIds.length === 0) {
      return this.generateEmptyHeatmap(startDate);
    }

    // Buscar sessões de estudo
    const { data: sessoes } = await client
      .from("sessoes_estudo")
      .select("created_at, tempo_total_liquido_segundos")
      .in("usuario_id", alunoIds)
      .gte("created_at", startDate.toISOString());

    // Agrupar por dia
    const dayMap = new Map<string, number>();
    for (const sessao of sessoes ?? []) {
      if (!sessao.created_at) continue;
      const date = new Date(sessao.created_at).toISOString().split("T")[0];
      const currentSeconds = dayMap.get(date) ?? 0;
      dayMap.set(
        date,
        currentSeconds + (sessao.tempo_total_liquido_segundos ?? 0),
      );
    }

    // Gerar array de dias
    const today = new Date();
    const result: HeatmapDay[] = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const seconds = dayMap.get(dateStr) ?? 0;

      // Calcular intensidade baseada em segundos (0-4)
      let intensity = 0;
      if (seconds > 0) {
        if (seconds < 1800)
          intensity = 1; // < 30 min
        else if (seconds < 3600)
          intensity = 2; // < 1h
        else if (seconds < 7200)
          intensity = 3; // < 2h
        else intensity = 4; // >= 2h
      }

      result.push({ date: dateStr, intensity });
    }

    return result;
  }

  /**
   * Gera heatmap vazio para o período
   */
  private generateEmptyHeatmap(startDate: Date): HeatmapDay[] {
    const today = new Date();
    const result: HeatmapDay[] = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      result.push({ date: d.toISOString().split("T")[0], intensity: 0 });
    }

    return result;
  }

  /**
   * Busca ranking dos melhores alunos
   */
  /**
   * Calcula streak de vários alunos em lote
   */
  private async getStudentsStreakBatch(
    studentIds: string[],
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<Map<string, number>> {
    if (studentIds.length === 0) return new Map();

    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const { data: sessoes } = await client
      .from("sessoes_estudo")
      .select("usuario_id, created_at")
      .in("usuario_id", studentIds)
      .gte("created_at", oneYearAgo.toISOString())
      .order("created_at", { ascending: false });

    const streaksMap = new Map<string, number>();
    const studentSessionsMap = new Map<string, string[]>();

    // Initialize with 0
    for (const id of studentIds) {
        streaksMap.set(id, 0);
        studentSessionsMap.set(id, []);
    }

    // Group dates by student
    for (const sessao of sessoes ?? []) {
      if (!sessao.usuario_id || !sessao.created_at) continue;

      if (studentSessionsMap.has(sessao.usuario_id)) {
        studentSessionsMap.get(sessao.usuario_id)!.push(new Date(sessao.created_at).toISOString().split("T")[0]);
      }
    }

    const todayStr = today.toISOString().split("T")[0];

    // Calculate streak for each student
    for (const [studentId, dates] of studentSessionsMap.entries()) {
        const uniqueDates = [...new Set(dates)].sort().reverse();
        if (uniqueDates.length === 0) continue;

        let streak = 0;

        // We check up to uniqueDates.length + 1 to handle the "skip today" case where the loop might need to go one step further
        // Actually the original logic loops over datas.length. If we skip today (i=0), we consume one iteration without checking a date from the list effectively?
        // No, i controls the expected date.

        for (let i = 0; i <= uniqueDates.length + 1; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expectedDateStr = expectedDate.toISOString().split("T")[0];

            if (uniqueDates.includes(expectedDateStr)) {
                streak++;
            } else if (i === 0 && uniqueDates[0] !== todayStr) {
                // Hoje não estudou, verificar se ontem estudou
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split("T")[0];

                if (uniqueDates[0] === yesterdayStr) {
                    // Continuar contando a partir de ontem
                    continue;
                }
                break;
            } else {
                break;
            }
        }
        streaksMap.set(studentId, streak);
    }

    return streaksMap;
  }

  /**
   * Calcula aproveitamento de vários alunos em lote
   */
  private async getStudentsAproveitamentoBatch(
    studentIds: string[],
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<Map<string, number>> {
    if (studentIds.length === 0) return new Map();

    const { data: progressos } = await client
      .from("progresso_atividades")
      .select("usuario_id, questoes_totais, questoes_acertos")
      .in("usuario_id", studentIds);

    const aproveitamentoMap = new Map<string, number>();
    const totalsMap = new Map<string, { total: number; acertos: number }>();

    // Initialize with 0
    for (const id of studentIds) {
        totalsMap.set(id, { total: 0, acertos: 0 });
        aproveitamentoMap.set(id, 0);
    }

    for (const p of progressos ?? []) {
      if (!p.usuario_id) continue;

      if (totalsMap.has(p.usuario_id)) {
          const current = totalsMap.get(p.usuario_id)!;
          current.total += p.questoes_totais ?? 0;
          current.acertos += p.questoes_acertos ?? 0;
      }
    }

    for (const [studentId, stats] of totalsMap.entries()) {
        if (stats.total === 0) {
            aproveitamentoMap.set(studentId, 0);
        } else {
            aproveitamentoMap.set(studentId, Math.round((stats.acertos / stats.total) * 100));
        }
    }

    return aproveitamentoMap;
  }

  async getStudentRanking(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 10,
    prefetchedAlunoIds?: string[],
  ): Promise<StudentRankingItem[]> {
    // Buscar apenas alunos da empresa (papel_base = 'aluno') if not provided
    let alunoIds = prefetchedAlunoIds;
    if (!alunoIds) {
      alunoIds = await this.getUserIdsByRole(empresaId, "aluno", client);
    }

    if (alunoIds.length === 0) return [];

    // 1. Calculate study time for ALL filtered students to determine ranking correctly
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessoes } = await client
      .from("sessoes_estudo")
      .select("usuario_id, tempo_total_liquido_segundos")
      .in("usuario_id", alunoIds)
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Agrupar tempo por aluno
    const tempoMap = new Map<string, number>();
    for (const sessao of sessoes ?? []) {
      if (!sessao.usuario_id) continue;
      const current = tempoMap.get(sessao.usuario_id) ?? 0;
      tempoMap.set(
        sessao.usuario_id,
        current + (sessao.tempo_total_liquido_segundos ?? 0),
      );
    }

    // 2. Identify top students based on time
    const rankedStudents = Array.from(tempoMap.entries())
        .map(([id, time]) => ({ id, time }))
        .sort((a, b) => b.time - a.time)
        .slice(0, limit);

    if (rankedStudents.length === 0) return [];

    const topStudentIds = rankedStudents.map(s => s.id);

    // 3. Fetch details ONLY for top students
    const { data: usuarios } = await client
      .from("usuarios")
      .select("id, nome_completo")
      .in("id", topStudentIds);

    const usuarioMap = new Map(usuarios?.map(u => [u.id, u]) ?? []);

    // 4. Calculate detailed metrics only for the winners
    const [streaksMap, aproveitamentoMap] = await Promise.all([
        this.getStudentsStreakBatch(topStudentIds, client),
        this.getStudentsAproveitamentoBatch(topStudentIds, client)
    ]);

    const ranking: StudentRankingItem[] = rankedStudents.map((student) => {
        const usuario = usuarioMap.get(student.id);
        const name = usuario?.nome_completo ?? "Aluno";

        const streak = streaksMap.get(student.id) ?? 0;
        const aproveitamento = aproveitamentoMap.get(student.id) ?? 0;

        const segundos = student.time;
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);

        return {
            id: student.id,
            name,
            avatarUrl: null,
            horasEstudo: `${horas}h ${minutos}m`,
            horasEstudoMinutos: Math.floor(segundos / 60),
            aproveitamento,
            streakDays: streak
        };
    });

    // Sort again because Promise.all order is preserved but good to be safe if logic changes
    ranking.sort((a, b) => b.horasEstudoMinutos - a.horasEstudoMinutos);

    return ranking;
  }

  /**
   * Calcula streak de um aluno
   */
  private async getStudentStreak(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    const { data: sessoes } = await client
      .from("sessoes_estudo")
      .select("created_at")
      .eq("usuario_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(365);

    if (!sessoes || sessoes.length === 0) return 0;

    // Extrair datas únicas
    const datas = [
      ...new Set(
        sessoes
          .filter((s): s is { created_at: string } => s.created_at !== null)
          .map((s) => new Date(s.created_at).toISOString().split("T")[0]),
      ),
    ]
      .sort()
      .reverse();

    // Contar dias consecutivos a partir de hoje
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < datas.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (datas.includes(expectedDateStr)) {
        streak++;
      } else if (i === 0 && datas[0] !== today) {
        // Hoje não estudou, verificar se ontem estudou
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (datas[0] === yesterdayStr) {
          // Continuar contando a partir de ontem
          continue;
        }
        break;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcula aproveitamento de um aluno
   */
  private async getStudentAproveitamento(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    // Use progresso_atividades instead of respostas_questoes (which doesn't exist)
    const { data: progressos } = await client
      .from("progresso_atividades")
      .select("questoes_totais, questoes_acertos")
      .eq("usuario_id", alunoId);

    if (!progressos || progressos.length === 0) return 0;

    let totalQuestoes = 0;
    let totalAcertos = 0;
    for (const p of progressos) {
      totalQuestoes += p.questoes_totais ?? 0;
      totalAcertos += p.questoes_acertos ?? 0;
    }

    if (totalQuestoes === 0) return 0;
    return Math.round((totalAcertos / totalQuestoes) * 100);
  }

  /**
   * Busca ranking dos professores
   */
  async getProfessorRanking(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 10,
    prefetchedProfIds?: string[],
  ): Promise<ProfessorRankingItem[]> {
    // Buscar apenas professores da empresa (papel_base = 'professor') if not provided
    let profIds = prefetchedProfIds;
    if (!profIds) {
      profIds = await this.getUserIdsByRole(empresaId, "professor", client);
    }

    if (profIds.length === 0) return [];

    // Buscar dados dos professores (limitado aos IDs de professores reais)
    const { data: professores } = await client
      .from("usuarios")
      .select("id, nome_completo, foto_url")
      .in("id", profIds)
      .limit(100);

    if (!professores || professores.length === 0) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Bulk fetch agendamentos for these professors
    const { data: agendamentos } = await client
        .from("agendamentos")
        .select("professor_id, aluno_id, status")
        .in("professor_id", professores.map(p => p.id))
        .gte("created_at", thirtyDaysAgo.toISOString());

    // Aggregate in memory
    const statsMap = new Map<string, { realizados: number; alunosUnicos: Set<string> }>();

    for (const appt of agendamentos ?? []) {
        if (!statsMap.has(appt.professor_id)) {
            statsMap.set(appt.professor_id, { realizados: 0, alunosUnicos: new Set() });
        }
        const stats = statsMap.get(appt.professor_id)!;

        // Count unique students (any status? Original code filtered distinct aluno_id for ALL agendamentos >= 30 days)
        stats.alunosUnicos.add(appt.aluno_id);

        // Count completed
        if (appt.status === 'concluido') {
            stats.realizados++;
        }
    }

    const ranking: ProfessorRankingItem[] = professores.map(professor => {
        const stats = statsMap.get(professor.id) || { realizados: 0, alunosUnicos: new Set() };
        return {
            id: professor.id,
            name: professor.nome_completo ?? "Professor",
            avatarUrl: professor.foto_url ?? null,
            alunosAtendidos: stats.alunosUnicos.size,
            agendamentosRealizados: stats.realizados
        };
    });

    // Ordenar por alunos atendidos (maior primeiro)
    ranking.sort((a, b) => b.alunosAtendidos - a.alunosAtendidos);

    return ranking.slice(0, limit);
  }

  /**
   * Busca performance por disciplina
   */
  private async getPerformanceByDisciplina(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    prefetchedAlunoIds?: string[],
  ): Promise<DisciplinaPerformance[]> {
    // Buscar disciplinas da empresa
    const { data: disciplines } = await client
      .from("disciplinas")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .limit(20);

    if (!disciplines || disciplines.length === 0) return [];
    const disciplinaMap = new Map(disciplines.map(d => [d.id, d.nome]));

    // Buscar apenas alunos da empresa (papel_base = 'aluno') if not provided
    let alunoIds = prefetchedAlunoIds;
    if (!alunoIds) {
      alunoIds = await this.getUserIdsByRole(empresaId, "aluno", client);
    }

    if (alunoIds.length === 0) return [];

    // Bulk fetch sessions
    const { data: sessoes } = await client
        .from("sessoes_estudo")
        .select("usuario_id, disciplina_id")
        .in("usuario_id", alunoIds)
        .in("disciplina_id", disciplines.map(d => d.id));

    // Group sessions
    const sessionsByDisc = new Map<string, Set<string>>(); // discId -> Set<userId>
    for (const s of sessoes ?? []) {
        if (!s.disciplina_id || !s.usuario_id) continue;
        if (!sessionsByDisc.has(s.disciplina_id)) {
            sessionsByDisc.set(s.disciplina_id, new Set());
        }
        sessionsByDisc.get(s.disciplina_id)!.add(s.usuario_id);
    }

    // Bulk fetch progress with deep linking
    const { data: progressos } = await client
        .from("progresso_atividades")
        .select(`
            usuario_id,
            questoes_totais,
            questoes_acertos,
            atividades!inner (
                modulos!inner (
                    frentes!inner (
                        disciplina_id
                    )
                )
            )
        `)
        .in("usuario_id", alunoIds)
        .not("atividade_id", "is", null);

    // Group progress
    const progressByDisc = new Map<string, { total: number; acertos: number }>();

    // Type casting for deep response
    type DeepProgress = {
        usuario_id: string;
        questoes_totais: number | null;
        questoes_acertos: number | null;
        atividades: {
            modulos: {
                frentes: {
                    disciplina_id: string;
                } | null
            } | null
        } | null
    };

    for (const p of (progressos as unknown as DeepProgress[]) ?? []) {
        const discId = p.atividades?.modulos?.frentes?.disciplina_id;
        if (!discId || !disciplinaMap.has(discId)) continue;

        if (!progressByDisc.has(discId)) {
            progressByDisc.set(discId, { total: 0, acertos: 0 });
        }
        const stats = progressByDisc.get(discId)!;
        stats.total += p.questoes_totais ?? 0;
        stats.acertos += p.questoes_acertos ?? 0;
    }

    // Assemble result
    const performance: DisciplinaPerformance[] = disciplines.map(d => {
        const activeStudents = sessionsByDisc.get(d.id)?.size ?? 0;

        if (activeStudents === 0) return null;

        const pStats = progressByDisc.get(d.id) || { total: 0, acertos: 0 };
        const aproveitamento = pStats.total > 0
            ? Math.round((pStats.acertos / pStats.total) * 100)
            : 0;

        return {
            id: d.id,
            name: d.nome,
            aproveitamento,
            totalQuestoes: pStats.total,
            alunosAtivos: activeStudents
        };
    }).filter((p): p is DisciplinaPerformance => p !== null);

    // Ordenar por aproveitamento (maior primeiro)
    performance.sort((a, b) => b.aproveitamento - a.aproveitamento);

    return performance;
  }

  /**
   * Calcula datas do período
   */
  private getPeriodDates(period: DashboardPeriod): {
    startDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case "semanal":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case "mensal":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        previousEndDate = new Date(startDate);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case "anual":
      default:
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousEndDate = new Date(startDate);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    return { startDate, previousStartDate, previousEndDate };
  }
}
