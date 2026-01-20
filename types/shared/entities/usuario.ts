/**
 * Tipos para Usuários da Instituição (Staff)
 * Substitui a antiga estrutura de Teacher/Professor
 */

import type { Papel, RoleTipo, RolePermissions } from './papel';

// Usuário da instituição (professor, admin, staff, monitor)
export interface Usuario {
  id: string;
  empresaId: string;
  papelId: string;
  papel?: Papel;
  nomeCompleto: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  chavePix: string | null;
  fotoUrl: string | null;
  biografia: string | null;
  especialidade: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Usuário com informações expandidas de papel
export interface UsuarioWithPapel extends Usuario {
  papel: Papel;
  permissoes: RolePermissions;
}

// Resumo do usuário para listagens
export interface UsuarioSummary {
  id: string;
  nomeCompleto: string;
  email: string;
  fotoUrl: string | null;
  papelNome: string;
  papelTipo: RoleTipo;
  ativo: boolean;
}

// Input para criar usuário
export interface CreateUsuarioInput {
  id?: string; // Opcional - se não fornecido, será gerado
  empresaId: string;
  papelId: string;
  nomeCompleto: string;
  email: string;
  cpf?: string;
  telefone?: string;
  chavePix?: string;
  fotoUrl?: string;
  biografia?: string;
  especialidade?: string;
  // Para criação com senha temporária
  password?: string;
  mustChangePassword?: boolean;
}

// Input para atualizar usuário
export interface UpdateUsuarioInput {
  papelId?: string;
  nomeCompleto?: string;
  email?: string;
  cpf?: string | null;
  telefone?: string | null;
  chavePix?: string | null;
  fotoUrl?: string | null;
  biografia?: string | null;
  especialidade?: string | null;
  ativo?: boolean;
}

// Vínculo usuário-disciplina
export interface UsuarioDisciplina {
  id: string;
  usuarioId: string;
  disciplinaId: string;
  empresaId: string;
  cursoId: string | null;
  turmaId: string | null;
  frenteId: string | null;
  moduloId: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input para vincular usuário a disciplina
export interface CreateUsuarioDisciplinaInput {
  usuarioId: string;
  disciplinaId: string;
  empresaId: string;
  cursoId?: string;
  turmaId?: string;
  frenteId?: string;
  moduloId?: string;
}

// Disciplina com informações básicas para exibição
export interface DisciplinaBasic {
  id: string;
  nome: string;
}

// Usuário com suas disciplinas
export interface UsuarioWithDisciplinas extends Usuario {
  disciplinas: DisciplinaBasic[];
}
