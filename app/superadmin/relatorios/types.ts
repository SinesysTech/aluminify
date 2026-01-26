/**
 * Types for Super Admin Relatórios module
 */

export interface GrowthDataPoint {
  month: string
  empresas: number
  professores: number
  alunos: number
}

export interface PlanDistribution {
  plano: string
  total: number
  percentage: number
}

export interface TopEmpresa {
  id: string
  nome: string
  slug: string
  totalUsuarios: number
  totalCursos: number
  plano: string
}

export interface ReportStats {
  // Growth data for charts
  growthData: GrowthDataPoint[]
  // Plan distribution
  planDistribution: PlanDistribution[]
  // Top empresas by users
  topEmpresas: TopEmpresa[]
  // Summary stats
  summary: {
    totalEmpresas: number
    totalProfessores: number
    totalAlunos: number
    totalCursos: number
    crescimentoEmpresas: number // % growth last 30 days
    crescimentoUsuarios: number // % growth last 30 days
  }
}

export type ExportFormat = "csv" | "json"

export interface ExportOptions {
  type: "empresas" | "professores" | "alunos" | "all"
  format: ExportFormat
}
