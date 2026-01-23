/**
 * Tipos TypeScript para o Dashboard da Instituição
 *
 * Usado quando o professor tem isEmpresaAdmin = true
 */

import type { HeatmapDay } from './dashboard'

export interface InstitutionSummary {
  totalAlunos: number
  totalProfessores: number
  totalCursos: number
  alunosAtivos: number
}

export interface InstitutionEngagement {
  totalHorasEstudo: string // Formato "XXXh XXm"
  horasEstudoDelta: string // Formato "+Xh" ou "-Xh"
  atividadesConcluidas: number
  taxaConclusao: number // Percentual (0-100)
}

export interface StudentRankingItem {
  id: string
  name: string
  avatarUrl: string | null
  horasEstudo: string // Formato "XXh XXm"
  horasEstudoMinutos: number // Para ordenação
  aproveitamento: number // Percentual (0-100)
  streakDays: number
}

export interface ProfessorRankingItem {
  id: string
  name: string
  avatarUrl: string | null
  alunosAtendidos: number
  agendamentosRealizados: number
}

export interface DisciplinaPerformance {
  id: string
  name: string
  aproveitamento: number // Percentual (0-100)
  totalQuestoes: number
  alunosAtivos: number
}

export interface InstitutionDashboardData {
  empresaNome: string
  userName: string
  summary: InstitutionSummary
  engagement: InstitutionEngagement
  heatmap: HeatmapDay[]
  rankingAlunos: StudentRankingItem[]
  rankingProfessores: ProfessorRankingItem[]
  performanceByDisciplina: DisciplinaPerformance[]
}

// Response types para API
export interface InstitutionDashboardResponse {
  success: boolean
  data?: InstitutionDashboardData
  error?: string
}
