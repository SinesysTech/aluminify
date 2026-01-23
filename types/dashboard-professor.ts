/**
 * Tipos TypeScript para o Dashboard do Professor
 *
 * Usado quando o usuário tem papel sem permissões administrativas (professor, staff, monitor)
 */

export interface ProfessorSummary {
  alunosAtendidos: number
  agendamentosPendentes: number
  agendamentosRealizadosMes: number
  proximoAgendamento: string | null // Data/hora do próximo agendamento
}

export interface StudentUnderCare {
  id: string
  name: string
  avatarUrl: string | null
  cursoNome: string
  progresso: number // Percentual (0-100)
  ultimaAtividade: string | null // Data ISO
  aproveitamento: number // Percentual (0-100)
}

export interface UpcomingAppointment {
  id: string
  alunoId: string
  alunoNome: string
  alunoAvatar: string | null
  dataHora: string // Data ISO
  duracao: number // Minutos
  status: 'pendente' | 'confirmado' | 'cancelado' | 'realizado'
  titulo: string | null
  notas: string | null
}

export interface ProfessorDisciplinaPerformance {
  id: string
  name: string
  aproveitamentoMedio: number // Percentual (0-100)
  totalAlunos: number
}

export interface ProfessorDashboardData {
  professorNome: string
  summary: ProfessorSummary
  alunos: StudentUnderCare[]
  agendamentos: UpcomingAppointment[]
  performanceAlunos: ProfessorDisciplinaPerformance[]
}

// Response types para API
export interface ProfessorDashboardResponse {
  success: boolean
  data?: ProfessorDashboardData
  error?: string
}
