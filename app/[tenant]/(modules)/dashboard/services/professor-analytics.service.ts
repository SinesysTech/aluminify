import { getDatabaseClient } from "@/app/shared/core/database/database";
import type {
  ProfessorDashboardData,
  ProfessorSummary,
  ProfessorDisciplinaPerformance,
} from "@/app/[tenant]/(modules)/dashboard/types";
import type { StudentUnderCare } from "@/app/[tenant]/(modules)/usuario/types";
import type { UpcomingAppointment } from "@/app/[tenant]/(modules)/agendamentos/types/types";

export class ProfessorAnalyticsService {
  /**
   * Busca dados agregados do dashboard do professor
   */
  async getProfessorDashboard(
    professorId: string,
    empresaId: string,
  ): Promise<ProfessorDashboardData> {
    const client = getDatabaseClient();

    // Buscar nome do professor
    const { data: professor } = await client
      .from("professores")
      .select("nome_completo")
      .eq("id", professorId)
      .single();

    const professorNome = professor?.nome_completo ?? "Professor";

    // Buscar métricas em paralelo
    const [summary, alunos, agendamentos, performanceAlunos] =
      await Promise.all([
        this.getSummary(professorId, client),
        this.getStudentsUnderCare(professorId, empresaId, client),
        this.getUpcomingAppointments(professorId, client, 10),
        this.getPerformanceAlunos(professorId, empresaId, client),
      ]);

    return {
      professorNome,
      summary,
      alunos,
      agendamentos,
      performanceAlunos,
    };
  }

  /**
   * Busca resumo do professor
   */
  private async getSummary(
    professorId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<ProfessorSummary> {
    // Buscar alunos únicos atendidos
    const { data: agendamentosTodos } = await client
      .from("agendamentos")
      .select("aluno_id")
      .eq("professor_id", professorId);

    const alunosUnicos = new Set(
      (agendamentosTodos ?? []).map((a) => a.aluno_id),
    );

    // Buscar agendamentos pendentes
    const { count: agendamentosPendentes } = await client
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("professor_id", professorId)
      .eq("status", "pendente")
      .gte("data_inicio", new Date().toISOString());

    // Buscar agendamentos realizados no mês
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: agendamentosRealizadosMes } = await client
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("professor_id", professorId)
      .eq("status", "concluido")
      .gte("data_inicio", inicioMes.toISOString());

    // Buscar próximo agendamento
    const { data: proximoAgendamentoData } = await client
      .from("agendamentos")
      .select("data_inicio")
      .eq("professor_id", professorId)
      .in("status", ["pendente", "confirmado"])
      .gte("data_inicio", new Date().toISOString())
      .order("data_inicio", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      alunosAtendidos: alunosUnicos.size,
      agendamentosPendentes: agendamentosPendentes ?? 0,
      agendamentosRealizadosMes: agendamentosRealizadosMes ?? 0,
      proximoAgendamento: proximoAgendamentoData?.data_inicio ?? null,
    };
  }

  /**
   * Busca alunos sob tutela do professor (via agendamentos)
   */
  async getStudentsUnderCare(
    professorId: string,
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 20,
  ): Promise<StudentUnderCare[]> {
    // Buscar agendamentos do professor
    const { data: agendamentos } = await client
      .from("agendamentos")
      .select("aluno_id")
      .eq("professor_id", professorId)
      .order("data_inicio", { ascending: false })
      .limit(100);

    if (!agendamentos || agendamentos.length === 0) return [];

    // Extrair IDs únicos de alunos
    const alunoIdsUnicos = [...new Set(agendamentos.map((a) => a.aluno_id))];

    // Buscar dados dos alunos
    const { data: alunos } = await client
      .from("alunos")
      .select("id, nome_completo, empresa_id")
      .in("id", alunoIdsUnicos)
      .eq("empresa_id", empresaId);

    if (!alunos || alunos.length === 0) return [];

    // Extrair alunos únicos
    const alunosMap = new Map<
      string,
      {
        id: string;
        name: string;
        avatarUrl: string | null;
      }
    >();

    for (const aluno of alunos) {
      if (!alunosMap.has(aluno.id)) {
        alunosMap.set(aluno.id, {
          id: aluno.id,
          name: aluno.nome_completo ?? "Aluno",
          avatarUrl: null,
        });
      }
    }

    const result: StudentUnderCare[] = [];

    for (const [alunoId, alunoInfo] of alunosMap) {
      // Buscar curso do aluno
      const { data: alunoCurso } = await client
        .from("alunos_cursos")
        .select(
          `
          cursos!inner (
            nome
          )
        `,
        )
        .eq("aluno_id", alunoId)
        .limit(1)
        .maybeSingle();

      // Buscar progresso do aluno (baseado em cronograma)
      const progresso = await this.getStudentProgress(alunoId, client);

      // Buscar última atividade
      const { data: ultimaSessao } = await client
        .from("sessoes_estudo")
        .select("created_at")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar aproveitamento
      const aproveitamento = await this.getStudentAproveitamento(
        alunoId,
        client,
      );

      result.push({
        id: alunoInfo.id,
        name: alunoInfo.name,
        avatarUrl: alunoInfo.avatarUrl,
        cursoNome:
          (alunoCurso?.cursos as { nome: string })?.nome ?? "Sem curso",
        progresso,
        ultimaAtividade: ultimaSessao?.created_at ?? null,
        aproveitamento,
      });
    }

    // Ordenar por última atividade (mais recente primeiro)
    result.sort((a, b) => {
      if (!a.ultimaAtividade && !b.ultimaAtividade) return 0;
      if (!a.ultimaAtividade) return 1;
      if (!b.ultimaAtividade) return -1;
      return (
        new Date(b.ultimaAtividade).getTime() -
        new Date(a.ultimaAtividade).getTime()
      );
    });

    return result.slice(0, limit);
  }

  /**
   * Calcula progresso do aluno baseado no cronograma
   */
  private async getStudentProgress(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    // Buscar cronograma do aluno
    const { data: cronograma } = await client
      .from("cronogramas")
      .select("id")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cronograma) return 0;

    // Contar itens totais e assistidos
    const { count: totalItens } = await client
      .from("cronograma_itens")
      .select("id", { count: "exact", head: true })
      .eq("cronograma_id", cronograma.id);

    const { count: itensAssistidos } = await client
      .from("cronograma_itens")
      .select("id", { count: "exact", head: true })
      .eq("cronograma_id", cronograma.id)
      .eq("concluido", true);

    if (!totalItens || totalItens === 0) return 0;
    return Math.round(((itensAssistidos ?? 0) / totalItens) * 100);
  }

  /**
   * Calcula aproveitamento do aluno (usando progresso_atividades)
   */
  private async getStudentAproveitamento(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    const { data: progressos } = await client
      .from("progresso_atividades")
      .select("questoes_totais, questoes_acertos")
      .eq("aluno_id", alunoId);

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
   * Busca próximos agendamentos
   */
  async getUpcomingAppointments(
    professorId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 10,
  ): Promise<UpcomingAppointment[]> {
    const { data: agendamentos } = await client
      .from("agendamentos")
      .select("id, aluno_id, data_inicio, data_fim, status, observacoes")
      .eq("professor_id", professorId)
      .in("status", ["pendente", "confirmado"])
      .gte("data_inicio", new Date().toISOString())
      .order("data_inicio", { ascending: true })
      .limit(limit);

    if (!agendamentos || agendamentos.length === 0) return [];

    // Buscar nomes dos alunos
    const alunoIds = [...new Set(agendamentos.map((a) => a.aluno_id))];
    const { data: alunos } = await client
      .from("alunos")
      .select("id, nome_completo")
      .in("id", alunoIds);

    const alunoMap = new Map(
      (alunos ?? []).map((a) => [a.id, a.nome_completo]),
    );

    return agendamentos.map((agendamento) => {
      // Calculate duration in minutes from data_inicio to data_fim
      const inicio = new Date(agendamento.data_inicio);
      const fim = new Date(agendamento.data_fim);
      const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60000);

      // Map DB status to interface status (concluido -> realizado)
      const statusMap: Record<string, UpcomingAppointment["status"]> = {
        pendente: "pendente",
        confirmado: "confirmado",
        cancelado: "cancelado",
        concluido: "realizado",
      };

      return {
        id: agendamento.id,
        alunoId: agendamento.aluno_id,
        alunoNome: alunoMap.get(agendamento.aluno_id) ?? "Aluno",
        alunoAvatar: null,
        dataHora: agendamento.data_inicio,
        duracao: duracao > 0 ? duracao : 60,
        status: statusMap[agendamento.status] ?? "pendente",
        titulo: null,
        notas: agendamento.observacoes ?? null,
      };
    });
  }

  /**
   * Busca performance dos alunos por disciplina (usando progresso_atividades)
   */
  private async getPerformanceAlunos(
    professorId: string,
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<ProfessorDisciplinaPerformance[]> {
    // Buscar alunos com agendamentos com este professor
    const { data: agendamentos } = await client
      .from("agendamentos")
      .select("aluno_id")
      .eq("professor_id", professorId);

    if (!agendamentos || agendamentos.length === 0) return [];

    const alunoIds = [...new Set(agendamentos.map((a) => a.aluno_id))];

    // Buscar disciplinas da empresa
    const { data: disciplinas } = await client
      .from("disciplinas")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .limit(10);

    if (!disciplinas || disciplinas.length === 0) return [];

    const performance: ProfessorDisciplinaPerformance[] = [];

    for (const disciplina of disciplinas) {
      // Buscar sessões de estudo para esta disciplina
      const { data: sessoes } = await client
        .from("sessoes_estudo")
        .select("aluno_id")
        .in("aluno_id", alunoIds)
        .eq("disciplina_id", disciplina.id);

      if (!sessoes || sessoes.length === 0) continue;

      // Buscar aproveitamento agregado dos alunos (usando progresso_atividades)
      const { data: progressos } = await client
        .from("progresso_atividades")
        .select("aluno_id, questoes_totais, questoes_acertos")
        .in("aluno_id", alunoIds);

      let totalQuestoes = 0;
      let totalAcertos = 0;
      const alunosSet = new Set<string>();

      for (const p of progressos ?? []) {
        if (p.aluno_id) alunosSet.add(p.aluno_id);
        totalQuestoes += p.questoes_totais ?? 0;
        totalAcertos += p.questoes_acertos ?? 0;
      }

      const aproveitamentoMedio =
        totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

      performance.push({
        id: disciplina.id,
        name: disciplina.nome,
        aproveitamentoMedio,
        totalAlunos: alunosSet.size,
      });
    }

    // Ordenar por aproveitamento (maior primeiro)
    performance.sort((a, b) => b.aproveitamentoMedio - a.aproveitamentoMedio);

    return performance;
  }
}
