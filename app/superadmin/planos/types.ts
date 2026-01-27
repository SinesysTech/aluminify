/**
 * Types for Super Admin Planos module
 */

export type PlanoId = "basico" | "profissional" | "enterprise"

export interface PlanoFeature {
  id: string
  name: string
  description: string
  included: boolean
  limit?: number | "unlimited"
}

export interface PlanoConfig {
  id: PlanoId
  name: string
  description: string
  priceCents: number
  priceInterval: "month" | "year"
  features: PlanoFeature[]
  limits: {
    maxProfessores: number | null // null = unlimited
    maxAlunos: number | null
    maxCursos: number | null
    maxStorage: number | null // in MB
    customBranding: boolean
    apiAccess: boolean
    prioritySupport: boolean
  }
  recommended?: boolean
}

export interface PlanoStats {
  planoId: PlanoId
  totalEmpresas: number
  empresasAtivas: number
  totalUsuarios: number
  totalRevenue: number // last 30 days
}

export interface PlanoDistribution {
  planoId: PlanoId
  name: string
  count: number
  percentage: number
  priceCents: number
}

export interface EmpresaForPlanChange {
  id: string
  nome: string
  slug: string
  planoAtual: PlanoId
  totalUsuarios: number
  createdAt: string
}

export interface PlanoChangeHistory {
  id: string
  empresaId: string
  empresaNome: string
  planoAnterior: PlanoId
  planoNovo: PlanoId
  changedAt: string
  changedBy: string
}
