/**
 * Types for Super Admin Professores module
 */

export interface ProfessorWithEmpresa {
  id: string
  email: string
  fullName: string | null
  cpf: string | null
  phone: string | null
  specialty: string | null
  isAdmin: boolean
  empresaId: string | null
  empresaNome: string | null
  empresaSlug: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfessoresFilters {
  search: string
  empresaId: "all" | string
  isAdmin: "all" | "true" | "false"
}

export interface EmpresaOption {
  id: string
  nome: string
  slug: string
}
