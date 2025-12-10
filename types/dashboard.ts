/**
 * Tipos TypeScript para o Dashboard Analytics do Aluno
 */

export interface UserInfo {
  name: string
  email: string
  avatarUrl: string
  streakDays: number
}

export interface Metrics {
  scheduleProgress: number // Percentual (0-100)
  focusTime: string // Formato "12h 30m"
  focusTimeDelta: string // Formato "+2h" ou "-1h"
  questionsAnswered: number
  questionsAnsweredPeriod: string // Ex: "Essa semana"
  accuracy: number // Percentual (0-100)
  flashcardsReviewed: number
}

export interface HeatmapDay {
  date: string // Formato ISO: "2023-01-01"
  intensity: number // 0 = nenhum, 1-4 = intensidade crescente
}

export interface SubjectPerformance {
  id: number
  name: string // Nome da disciplina
  front: string // Nome da frente
  score: number // Percentual (0-100)
  isNotStarted?: boolean // true se não houver progresso
}

export interface FocusEfficiencyDay {
  day: string // "Seg", "Ter", "Qua", etc.
  grossTime: number // Tempo bruto em minutos
  netTime: number // Tempo líquido em minutos
}

export interface StrategicDomain {
  baseModules: number // Percentual (0-100)
  highRecurrence: number // Percentual (0-100)
}

export interface SubjectDistributionItem {
  name: string
  percentage: number // Percentual (0-100)
  color: string // Cor em formato hex ou Tailwind class
}

export interface DashboardData {
  user: UserInfo
  metrics: Metrics
  heatmap: HeatmapDay[]
  subjects: SubjectPerformance[]
  focusEfficiency: FocusEfficiencyDay[]
  strategicDomain: StrategicDomain
  subjectDistribution: SubjectDistributionItem[]
}



