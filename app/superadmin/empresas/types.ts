export type EmpresaPlano = 'basico' | 'profissional' | 'enterprise';

export interface EmpresaWithMetrics {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  emailContato: string | null;
  telefone: string | null;
  logoUrl: string | null;
  plano: EmpresaPlano;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Metrics
  totalUsuarios: number;
  totalAlunos: number;
  totalCursos: number;
}

export interface CreateEmpresaInput {
  nome: string;
  cnpj?: string;
  emailContato?: string;
  telefone?: string;
  plano?: EmpresaPlano;
  // First admin
  primeiroAdminEmail?: string;
  primeiroAdminNome?: string;
  primeiroAdminPassword?: string;
}

export interface UpdateEmpresaInput {
  nome?: string;
  cnpj?: string;
  emailContato?: string;
  telefone?: string;
  plano?: EmpresaPlano;
}

export interface EmpresaFilters {
  status?: 'all' | 'ativo' | 'inativo';
  plano?: 'all' | EmpresaPlano;
  search?: string;
}
