import { getDatabaseClient } from '@/backend/clients/database'
import type {
  InstitutionDashboardData,
  InstitutionSummary,
  InstitutionEngagement,
  StudentRankingItem,
  ProfessorRankingItem,
  DisciplinaPerformance,
} from '@/types/dashboard-institution'
import type { HeatmapDay } from '@/types/dashboard'

type DashboardPeriod = 'semanal' | 'mensal' | 'anual'

export class InstitutionAnalyticsService {
  /**
   * Busca dados agregados do dashboard da instituição
   */
  async getInstitutionDashboard(
    empresaId: string,
    period: DashboardPeriod = 'mensal'
  ): Promise<InstitutionDashboardData> {
    const client = getDatabaseClient()

    // Buscar nome da empresa
    const { data: empresa } = await client
      .from('empresas')
      .select('nome')
      .eq('id', empresaId)
      .single()

    const empresaNome = empresa?.nome ?? 'Instituição'

    // Buscar métricas em paralelo
    const [
      summary,
      engagement,
      heatmap,
      rankingAlunos,
      rankingProfessores,
      performanceByDisciplina,
    ] = await Promise.all([
      this.getSummary(empresaId, client),
      this.getEngagement(empresaId, client, period),
      this.getHeatmapData(empresaId, client, period),
      this.getStudentRanking(empresaId, client, 10),
      this.getProfessorRanking(empresaId, client, 10),
      this.getPerformanceByDisciplina(empresaId, client),
    ])

    return {
      empresaNome,
      summary,
      engagement,
      heatmap,
      rankingAlunos,
      rankingProfessores,
      performanceByDisciplina,
    }
  }

  /**
   * Busca resumo geral da instituição
   */
  private async getSummary(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<InstitutionSummary> {
    // Buscar total de alunos da empresa
    const { count: totalAlunos } = await client
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)

    // Buscar total de professores da empresa
    const { count: totalProfessores } = await client
      .from('professores')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)

    // Buscar total de cursos da empresa
    const { count: totalCursos } = await client
      .from('cursos')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)

    // Alunos ativos (com alguma atividade nos últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: alunosSessoes } = await client
      .from('sessoes_estudo')
      .select('aluno_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const alunosComAtividade = new Set(
      (alunosSessoes ?? []).map((s: { aluno_id: string }) => s.aluno_id)
    )

    // Filtrar apenas alunos da empresa
    const { data: alunosEmpresa } = await client
      .from('alunos')
      .select('id')
      .eq('empresa_id', empresaId)

    const alunosAtivos = (alunosEmpresa ?? []).filter(
      (a: { id: string }) => alunosComAtividade.has(a.id)
    ).length

    return {
      totalAlunos: totalAlunos ?? 0,
      totalProfessores: totalProfessores ?? 0,
      totalCursos: totalCursos ?? 0,
      alunosAtivos,
    }
  }

  /**
   * Busca métricas de engajamento
   */
  private async getEngagement(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    period: DashboardPeriod
  ): Promise<InstitutionEngagement> {
    const { startDate, previousStartDate, previousEndDate } = this.getPeriodDates(period)

    // Buscar alunos da empresa
    const { data: alunos } = await client
      .from('alunos')
      .select('id')
      .eq('empresa_id', empresaId)

    const alunoIds = (alunos ?? []).map((a: { id: string }) => a.id)

    if (alunoIds.length === 0) {
      return {
        totalHorasEstudo: '0h 0m',
        horasEstudoDelta: '+0h',
        atividadesConcluidas: 0,
        taxaConclusao: 0,
      }
    }

    // Tempo de estudo atual
    const { data: sessoesAtuais } = await client
      .from('sessoes_estudo')
      .select('duracao_segundos')
      .in('aluno_id', alunoIds)
      .gte('created_at', startDate.toISOString())

    const segundosAtuais = (sessoesAtuais ?? []).reduce(
      (acc: number, s: { duracao_segundos: number | null }) =>
        acc + (s.duracao_segundos ?? 0),
      0
    )

    // Tempo de estudo período anterior
    const { data: sessoesAnteriores } = await client
      .from('sessoes_estudo')
      .select('duracao_segundos')
      .in('aluno_id', alunoIds)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString())

    const segundosAnteriores = (sessoesAnteriores ?? []).reduce(
      (acc: number, s: { duracao_segundos: number | null }) =>
        acc + (s.duracao_segundos ?? 0),
      0
    )

    const horasAtuais = Math.floor(segundosAtuais / 3600)
    const minutosAtuais = Math.floor((segundosAtuais % 3600) / 60)
    const deltaHoras = Math.round((segundosAtuais - segundosAnteriores) / 3600)

    // Atividades concluídas (cronograma_itens com aula_assistida = true)
    const { count: atividadesConcluidas } = await client
      .from('cronograma_itens')
      .select('id', { count: 'exact', head: true })
      .in('cronograma_id',
        await this.getCronogramaIdsByAlunos(alunoIds, client)
      )
      .eq('aula_assistida', true)
      .gte('updated_at', startDate.toISOString())

    // Taxa de conclusão
    const { count: totalItens } = await client
      .from('cronograma_itens')
      .select('id', { count: 'exact', head: true })
      .in('cronograma_id',
        await this.getCronogramaIdsByAlunos(alunoIds, client)
      )

    const taxaConclusao =
      totalItens && totalItens > 0
        ? Math.round(((atividadesConcluidas ?? 0) / totalItens) * 100)
        : 0

    return {
      totalHorasEstudo: `${horasAtuais}h ${minutosAtuais}m`,
      horasEstudoDelta: deltaHoras >= 0 ? `+${deltaHoras}h` : `${deltaHoras}h`,
      atividadesConcluidas: atividadesConcluidas ?? 0,
      taxaConclusao,
    }
  }

  /**
   * Helper para obter IDs dos cronogramas dos alunos
   */
  private async getCronogramaIdsByAlunos(
    alunoIds: string[],
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<string[]> {
    if (alunoIds.length === 0) return []

    const { data: cronogramas } = await client
      .from('cronogramas')
      .select('id')
      .in('aluno_id', alunoIds)

    return (cronogramas ?? []).map((c: { id: string }) => c.id)
  }

  /**
   * Busca dados do heatmap institucional
   */
  private async getHeatmapData(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    period: DashboardPeriod
  ): Promise<HeatmapDay[]> {
    const { startDate } = this.getPeriodDates(period)

    // Buscar alunos da empresa
    const { data: alunos } = await client
      .from('alunos')
      .select('id')
      .eq('empresa_id', empresaId)

    const alunoIds = (alunos ?? []).map((a: { id: string }) => a.id)

    if (alunoIds.length === 0) {
      return this.generateEmptyHeatmap(startDate)
    }

    // Buscar sessões de estudo
    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('created_at, duracao_segundos')
      .in('aluno_id', alunoIds)
      .gte('created_at', startDate.toISOString())

    // Agrupar por dia
    const dayMap = new Map<string, number>()
    for (const sessao of sessoes ?? []) {
      const date = new Date(sessao.created_at).toISOString().split('T')[0]
      const currentSeconds = dayMap.get(date) ?? 0
      dayMap.set(date, currentSeconds + (sessao.duracao_segundos ?? 0))
    }

    // Gerar array de dias
    const today = new Date()
    const result: HeatmapDay[] = []

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const seconds = dayMap.get(dateStr) ?? 0

      // Calcular intensidade baseada em segundos (0-4)
      let intensity = 0
      if (seconds > 0) {
        if (seconds < 1800) intensity = 1 // < 30 min
        else if (seconds < 3600) intensity = 2 // < 1h
        else if (seconds < 7200) intensity = 3 // < 2h
        else intensity = 4 // >= 2h
      }

      result.push({ date: dateStr, intensity })
    }

    return result
  }

  /**
   * Gera heatmap vazio para o período
   */
  private generateEmptyHeatmap(startDate: Date): HeatmapDay[] {
    const today = new Date()
    const result: HeatmapDay[] = []

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      result.push({ date: d.toISOString().split('T')[0], intensity: 0 })
    }

    return result
  }

  /**
   * Busca ranking dos melhores alunos
   */
  async getStudentRanking(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 10
  ): Promise<StudentRankingItem[]> {
    // Buscar alunos da empresa com seus dados de usuário
    const { data: alunos } = await client
      .from('alunos')
      .select(`
        id,
        users!inner (
          full_name,
          avatar_url
        )
      `)
      .eq('empresa_id', empresaId)
      .limit(100)

    if (!alunos || alunos.length === 0) return []

    const alunoIds = alunos.map((a: { id: string }) => a.id)

    // Buscar tempo de estudo de cada aluno (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('aluno_id, duracao_segundos')
      .in('aluno_id', alunoIds)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Agrupar tempo por aluno
    const tempoMap = new Map<string, number>()
    for (const sessao of sessoes ?? []) {
      const current = tempoMap.get(sessao.aluno_id) ?? 0
      tempoMap.set(sessao.aluno_id, current + (sessao.duracao_segundos ?? 0))
    }

    // Buscar streak de cada aluno (simplificado)
    const streakMap = new Map<string, number>()
    for (const alunoId of alunoIds) {
      const streak = await this.getStudentStreak(alunoId, client)
      streakMap.set(alunoId, streak)
    }

    // Buscar aproveitamento de cada aluno
    const aproveitamentoMap = new Map<string, number>()
    for (const alunoId of alunoIds) {
      const aproveitamento = await this.getStudentAproveitamento(alunoId, client)
      aproveitamentoMap.set(alunoId, aproveitamento)
    }

    // Montar ranking
    const ranking: StudentRankingItem[] = alunos.map((aluno: {
      id: string
      users: { full_name: string | null; avatar_url: string | null }
    }) => {
      const segundos = tempoMap.get(aluno.id) ?? 0
      const horas = Math.floor(segundos / 3600)
      const minutos = Math.floor((segundos % 3600) / 60)

      return {
        id: aluno.id,
        name: aluno.users?.full_name ?? 'Aluno',
        avatarUrl: aluno.users?.avatar_url ?? null,
        horasEstudo: `${horas}h ${minutos}m`,
        horasEstudoMinutos: Math.floor(segundos / 60),
        aproveitamento: aproveitamentoMap.get(aluno.id) ?? 0,
        streakDays: streakMap.get(aluno.id) ?? 0,
      }
    })

    // Ordenar por tempo de estudo (maior primeiro)
    ranking.sort((a, b) => b.horasEstudoMinutos - a.horasEstudoMinutos)

    return ranking.slice(0, limit)
  }

  /**
   * Calcula streak de um aluno
   */
  private async getStudentStreak(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    const { data: sessoes } = await client
      .from('sessoes_estudo')
      .select('created_at')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(365)

    if (!sessoes || sessoes.length === 0) return 0

    // Extrair datas únicas
    const datas = [...new Set(
      sessoes.map((s: { created_at: string }) =>
        new Date(s.created_at).toISOString().split('T')[0]
      )
    )].sort().reverse()

    // Contar dias consecutivos a partir de hoje
    let streak = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < datas.length; i++) {
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (datas.includes(expectedDateStr)) {
        streak++
      } else if (i === 0 && datas[0] !== today) {
        // Hoje não estudou, verificar se ontem estudou
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (datas[0] === yesterdayStr) {
          // Continuar contando a partir de ontem
          continue
        }
        break
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Calcula aproveitamento de um aluno
   */
  private async getStudentAproveitamento(
    alunoId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<number> {
    const { data: respostas } = await client
      .from('respostas_questoes')
      .select('correta')
      .eq('aluno_id', alunoId)

    if (!respostas || respostas.length === 0) return 0

    const corretas = respostas.filter((r: { correta: boolean }) => r.correta).length
    return Math.round((corretas / respostas.length) * 100)
  }

  /**
   * Busca ranking dos professores
   */
  async getProfessorRanking(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>,
    limit = 10
  ): Promise<ProfessorRankingItem[]> {
    // Buscar professores da empresa
    const { data: professores } = await client
      .from('professores')
      .select(`
        id,
        users!inner (
          full_name,
          avatar_url
        )
      `)
      .eq('empresa_id', empresaId)
      .limit(100)

    if (!professores || professores.length === 0) return []

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Buscar estatísticas de cada professor
    const ranking: ProfessorRankingItem[] = []

    for (const professor of professores) {
      // Contar agendamentos realizados
      const { count: agendamentosRealizados } = await client
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('professor_id', professor.id)
        .eq('status', 'realizado')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Contar alunos únicos atendidos
      const { data: agendamentos } = await client
        .from('agendamentos')
        .select('aluno_id')
        .eq('professor_id', professor.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const alunosUnicos = new Set(
        (agendamentos ?? []).map((a: { aluno_id: string }) => a.aluno_id)
      )

      ranking.push({
        id: professor.id,
        name: (professor as { users: { full_name: string | null; avatar_url: string | null } }).users?.full_name ?? 'Professor',
        avatarUrl: (professor as { users: { avatar_url: string | null } }).users?.avatar_url ?? null,
        alunosAtendidos: alunosUnicos.size,
        agendamentosRealizados: agendamentosRealizados ?? 0,
      })
    }

    // Ordenar por alunos atendidos (maior primeiro)
    ranking.sort((a, b) => b.alunosAtendidos - a.alunosAtendidos)

    return ranking.slice(0, limit)
  }

  /**
   * Busca performance por disciplina
   */
  private async getPerformanceByDisciplina(
    empresaId: string,
    client: ReturnType<typeof getDatabaseClient>
  ): Promise<DisciplinaPerformance[]> {
    // Buscar disciplinas
    const { data: disciplinas } = await client
      .from('disciplinas')
      .select('id, nome')
      .limit(20)

    if (!disciplinas || disciplinas.length === 0) return []

    // Buscar alunos da empresa
    const { data: alunos } = await client
      .from('alunos')
      .select('id')
      .eq('empresa_id', empresaId)

    const alunoIds = (alunos ?? []).map((a: { id: string }) => a.id)

    const performance: DisciplinaPerformance[] = []

    for (const disciplina of disciplinas) {
      // Buscar questões da disciplina respondidas pelos alunos da empresa
      const { data: respostas } = await client
        .from('respostas_questoes')
        .select(`
          correta,
          aluno_id,
          questoes!inner (
            modulos!inner (
              frentes!inner (
                disciplina_id
              )
            )
          )
        `)
        .in('aluno_id', alunoIds)
        .eq('questoes.modulos.frentes.disciplina_id', disciplina.id)

      if (!respostas || respostas.length === 0) {
        continue
      }

      const corretas = respostas.filter((r: { correta: boolean }) => r.correta).length
      const aproveitamento = Math.round((corretas / respostas.length) * 100)
      const alunosAtivos = new Set(
        respostas.map((r: { aluno_id: string }) => r.aluno_id)
      ).size

      performance.push({
        id: disciplina.id,
        name: disciplina.nome,
        aproveitamento,
        totalQuestoes: respostas.length,
        alunosAtivos,
      })
    }

    // Ordenar por aproveitamento (maior primeiro)
    performance.sort((a, b) => b.aproveitamento - a.aproveitamento)

    return performance
  }

  /**
   * Calcula datas do período
   */
  private getPeriodDates(period: DashboardPeriod): {
    startDate: Date
    previousStartDate: Date
    previousEndDate: Date
  } {
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case 'semanal':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        previousEndDate = new Date(startDate)
        previousStartDate = new Date(previousEndDate)
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        break
      case 'mensal':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        previousEndDate = new Date(startDate)
        previousStartDate = new Date(previousEndDate)
        previousStartDate.setMonth(previousStartDate.getMonth() - 1)
        break
      case 'anual':
      default:
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 1)
        previousEndDate = new Date(startDate)
        previousStartDate = new Date(previousEndDate)
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1)
        break
    }

    return { startDate, previousStartDate, previousEndDate }
  }
}
