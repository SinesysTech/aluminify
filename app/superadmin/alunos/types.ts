/**
 * Types for Super Admin Alunos module
 */

export interface AlunoWithEmpresa {
  id: string
  email: string
  fullName: string | null
  cpf: string | null
  phone: string | null
  empresaId: string | null
  empresaNome: string | null
  empresaSlug: string | null
  totalCursos: number
  createdAt: string
  updatedAt: string
}

export interface AlunosFilters {
  search: string
  empresaId: "all" | string
}

export interface EmpresaOption {
  id: string
  nome: string
  slug: string
}
