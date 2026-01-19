import { getDatabaseClient } from "@/backend/clients/database";
import type {
  ProfessorDashboardData,
  ProfessorSummary,
  StudentUnderCare,
  UpcomingAppointment,
  ProfessorDisciplinaPerformance,
} from "@/types/dashboard-professor";

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
      .select(
        `
        users!inner (
          full_name
        )
      `,
      )
      .eq("id", professorId)
      .single();

    const professorNome =
      (professor as { users: { full_name: string | null } })?.users
        ?.full_name ?? "Professor";

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
      (agendamentosTodos ?? []).map((a: { aluno_id: string }) => a.aluno_id),
    );

    // Buscar agendamentos pendentes
    const { count: agendamentosPendentes } = await client
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("professor_id", professorId)
      .eq("status", "pendente")
      .gte("data_hora", new Date().toISOString());

    // Buscar agendamentos realizados no mês
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: agendamentosRealizadosMes } = await client
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("professor_id", professorId)
      .eq("status", "realizado")
      .gte("data_hora", inicioMes.toISOString());

    // Buscar próximo agendamento
    const { data: proximoAgendamentoData } = await client
      .from("agendamentos")
      .select("data_hora")
      .eq("professor_id", professorId)
      .in("status", ["pendente", "confirmado"])
      .gte("data_hora", new Date().toISOString())
      .order("data_hora", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      alunosAtendidos: alunosUnicos.size,
      agendamentosPendentes: agendamentosPendentes ?? 0,
      agendamentosRealizadosMes: agendamentosRealizadosMes ?? 0,
      proximoAgendamento: proximoAgendamentoData?.data_hora ?? null,
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
    // Buscar alunos com agendamentos com este professor
    const { data: agendamentos } = await client
      .from("agendamentos")
      .select(
        `
        aluno_id,
        alunos!inner (
          id,
          empresa_id,
          users!inner (
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("professor_id", professorId)
      .order("data_hora", { ascending: false })
      .limit(100);

    if (!agendamentos || agendamentos.length === 0) return [];

    // Extrair alunos únicos
    const alunosMap = new Map<
      string,
      {
        id: string;
        name: string;
        avatarUrl: string | null;
      }
    >();

    for (const agendamento of agendamentos) {
      const aluno = agendamento.alunos as {
        id: string;
        empresa_id: string;
        users: { full_name: string | null; avatar_url: string | null };
      };

      // Filtrar apenas alunos da mesma empresa
      if (aluno.empresa_id !== empresaId) continue;

      if (!alunosMap.has(aluno.id)) {
        alunosMap.set(aluno.id, {
          id: aluno.id,
          name: aluno.users?.full_name ?? "Aluno",
          avatarUrl: aluno.users?.avatar_url ?? null,
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
      .eq("aula_assistida", true);

    if (!totalItens || totalItens === 0) return 0;
    return Math.round(((itensAssistidos ?? 0) / totalItens) * 100);
  }

  /**
   * Calcula aproveitamento do aluno
   */
  private async getStudentAproveitamento(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>,
  ): Promise<number> {
    const { data: respostas } = await client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("respostas_questoes" as any)
      .select("correta")
      .eq("aluno_id", alunoId);

    if (!respostas || respostas.length === 0) return 0;

    const corretas = respostas.filter(
      (r: { correta: boolean }) => r.correta,
    ).length;
    return Math.round((corretas / respostas.length) * 100);
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
      .select(
        `
        id,
        aluno_id,
        data_hora,
        duracao_minutos,
        status,
        titulo,
        notas,
        alunos!inner (
          users!inner (
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("professor_id", professorId)
      .in("status", ["pendente", "confirmado"])
      .gte("data_hora", new Date().toISOString())
      .order("data_hora", { ascending: true })
      .limit(limit);

    if (!agendamentos || agendamentos.length === 0) return [];

    return agendamentos.map((agendamento) => {
      const aluno = (
        Array.isArray(agendamento.alunos)
          ? agendamento.alunos[0]
          : agendamento.alunos
      ) as {
        users: { full_name: string | null; avatar_url: string | null };
      };

      return {
        id: agendamento.id,
        alunoId: agendamento.aluno_id,
        alunoNome: aluno.users?.full_name ?? "Aluno",
        alunoAvatar: aluno.users?.avatar_url ?? null,
        dataHora: agendamento.data_hora,
        duracao: agendamento.duracao_minutos ?? 60,
        status: agendamento.status as
          | "pendente"
          | "confirmado"
          | "cancelado"
          | "realizado",
        titulo: agendamento.titulo ?? null,
        notas: agendamento.notas ?? null,
      };
    });
  }

  /**
   * Busca performance dos alunos por disciplina
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

    const alunoIds = [
      ...new Set(agendamentos.map((a: { aluno_id: string }) => a.aluno_id)),
    ];

    // Buscar disciplinas
    const { data: disciplinas } = await client
      .from("disciplinas")
      .select("id, nome")
      .limit(10);

    if (!disciplinas || disciplinas.length === 0) return [];

    const performance: ProfessorDisciplinaPerformance[] = [];

    for (const disciplina of disciplinas) {
      // Buscar respostas dos alunos para questões desta disciplina
      const { data: respostas } = await client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("respostas_questoes" as any)
        .select(
          `
          correta,
          aluno_id,
          questoes!inner (
            modulos!inner (
              frentes!inner (
                disciplina_id
              )
            )
          )
        `,
        )
        .in("aluno_id", alunoIds)
        .eq("questoes.modulos.frentes.disciplina_id", disciplina.id);

      if (!respostas || respostas.length === 0) continue;

      const corretas = respostas.filter(
        (r: { correta: boolean }) => r.correta,
      ).length;
      const aproveitamentoMedio = Math.round(
        (corretas / respostas.length) * 100,
      );
      const totalAlunos = new Set(
        respostas.map((r: { aluno_id: string }) => r.aluno_id),
      ).size;

      performance.push({
        id: disciplina.id,
        name: disciplina.nome,
        aproveitamentoMedio,
        totalAlunos,
      });
    }

    // Ordenar por aproveitamento (maior primeiro)
    performance.sort((a, b) => b.aproveitamentoMedio - a.aproveitamentoMedio);

    return performance;
  }
}
