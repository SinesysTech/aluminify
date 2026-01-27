/**
 * Plan Configuration
 * Define all available plans with their features and limits
 */

import type { PlanoConfig } from "./types"

export const PLANOS_CONFIG: PlanoConfig[] = [
  {
    id: "basico",
    name: "Básico",
    description: "Para pequenas instituições que estão começando",
    priceCents: 9900, // R$ 99,00
    priceInterval: "month",
    features: [
      {
        id: "cursos",
        name: "Gestão de Cursos",
        description: "Crie e gerencie cursos",
        included: true,
        limit: 3,
      },
      {
        id: "alunos",
        name: "Alunos",
        description: "Cadastro de alunos",
        included: true,
        limit: 100,
      },
      {
        id: "professores",
        name: "Professores",
        description: "Cadastro de professores",
        included: true,
        limit: 5,
      },
      {
        id: "cronograma",
        name: "Cronogramas",
        description: "Planejamento de estudos",
        included: true,
      },
      {
        id: "flashcards",
        name: "Flashcards",
        description: "Sistema de revisão espaçada",
        included: true,
      },
      {
        id: "relatorios",
        name: "Relatórios Básicos",
        description: "Relatórios de desempenho",
        included: true,
      },
      {
        id: "branding",
        name: "Personalização de Marca",
        description: "Logo e cores customizadas",
        included: false,
      },
      {
        id: "api",
        name: "Acesso à API",
        description: "Integração via API REST",
        included: false,
      },
      {
        id: "suporte",
        name: "Suporte Prioritário",
        description: "Atendimento em até 24h",
        included: false,
      },
    ],
    limits: {
      maxProfessores: 5,
      maxAlunos: 100,
      maxCursos: 3,
      maxStorage: 1024, // 1GB
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: "profissional",
    name: "Profissional",
    description: "Para instituições em crescimento",
    priceCents: 29900, // R$ 299,00
    priceInterval: "month",
    recommended: true,
    features: [
      {
        id: "cursos",
        name: "Gestão de Cursos",
        description: "Crie e gerencie cursos",
        included: true,
        limit: 20,
      },
      {
        id: "alunos",
        name: "Alunos",
        description: "Cadastro de alunos",
        included: true,
        limit: 1000,
      },
      {
        id: "professores",
        name: "Professores",
        description: "Cadastro de professores",
        included: true,
        limit: 30,
      },
      {
        id: "cronograma",
        name: "Cronogramas",
        description: "Planejamento de estudos",
        included: true,
      },
      {
        id: "flashcards",
        name: "Flashcards",
        description: "Sistema de revisão espaçada",
        included: true,
      },
      {
        id: "relatorios",
        name: "Relatórios Avançados",
        description: "Analytics completo",
        included: true,
      },
      {
        id: "branding",
        name: "Personalização de Marca",
        description: "Logo e cores customizadas",
        included: true,
      },
      {
        id: "api",
        name: "Acesso à API",
        description: "Integração via API REST",
        included: false,
      },
      {
        id: "suporte",
        name: "Suporte Prioritário",
        description: "Atendimento em até 24h",
        included: false,
      },
    ],
    limits: {
      maxProfessores: 30,
      maxAlunos: 1000,
      maxCursos: 20,
      maxStorage: 10240, // 10GB
      customBranding: true,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes instituições com necessidades avançadas",
    priceCents: 99900, // R$ 999,00
    priceInterval: "month",
    features: [
      {
        id: "cursos",
        name: "Gestão de Cursos",
        description: "Crie e gerencie cursos",
        included: true,
        limit: "unlimited",
      },
      {
        id: "alunos",
        name: "Alunos",
        description: "Cadastro de alunos",
        included: true,
        limit: "unlimited",
      },
      {
        id: "professores",
        name: "Professores",
        description: "Cadastro de professores",
        included: true,
        limit: "unlimited",
      },
      {
        id: "cronograma",
        name: "Cronogramas",
        description: "Planejamento de estudos",
        included: true,
      },
      {
        id: "flashcards",
        name: "Flashcards",
        description: "Sistema de revisão espaçada",
        included: true,
      },
      {
        id: "relatorios",
        name: "Relatórios Avançados",
        description: "Analytics completo + exportação",
        included: true,
      },
      {
        id: "branding",
        name: "Personalização de Marca",
        description: "White-label completo",
        included: true,
      },
      {
        id: "api",
        name: "Acesso à API",
        description: "Integração via API REST",
        included: true,
      },
      {
        id: "suporte",
        name: "Suporte Prioritário",
        description: "Atendimento em até 4h + gerente dedicado",
        included: true,
      },
    ],
    limits: {
      maxProfessores: null, // unlimited
      maxAlunos: null,
      maxCursos: null,
      maxStorage: 102400, // 100GB
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
]

export function getPlanoConfig(planoId: string): PlanoConfig | undefined {
  return PLANOS_CONFIG.find((p) => p.id === planoId)
}

export function formatPlanPrice(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100)
}
