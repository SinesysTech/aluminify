/**
 * Tipos TypeScript para o Dashboard do Professor
 *
 * Usado quando o usuário tem papel sem permissões administrativas (professor, staff, monitor)
 */

export interface ProfessorSummary {
  alunosAtendidos: number;
  agendamentosPendentes: number;
  agendamentosRealizadosMes: number;
  proximoAgendamento: string | null; // Data/hora do próximo agendamento
}

export interface ProfessorDisciplinaPerformance {
  id: string;
  name: string;
  aproveitamentoMedio: number; // Percentual (0-100)
  totalAlunos: number;
}

export interface ProfessorDashboardData {
  professorNome: string;
  summary: ProfessorSummary;
  alunos: import("@/app/[tenant]/(modules)/usuario/types").StudentUnderCare[];
  agendamentos: import("@/app/[tenant]/(modules)/agendamentos/types/types").UpcomingAppointment[];
  performanceAlunos: ProfessorDisciplinaPerformance[];
}

// Response types para API
export interface ProfessorDashboardResponse {
  success: boolean;
  data?: ProfessorDashboardData;
  error?: string;
}
