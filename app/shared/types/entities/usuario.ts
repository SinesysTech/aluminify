/**
 * Tipos para Usuários (modelo unificado)
 * Uma única tabela `usuarios` contém dados pessoais de todas as pessoas.
 * O vínculo com empresas e papel base está em `usuarios_empresas`.
 */

import type { Papel, RoleTipo, RolePermissions } from './papel';
import type { PapelBase } from './user';

// Usuário unificado — 1 registro por pessoa
export interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  biografia: string | null;
  especialidade: string | null;
  chavePix: string | null;
  // Campos de endereço (originalmente de alunos)
  dataNascimento: Date | null;
  endereco: string | null;
  cep: string | null;
  numeroEndereco: string | null;
  complemento: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  pais: string | null;
  // Redes sociais
  instagram: string | null;
  twitter: string | null;
  // Matrícula / integração
  numeroMatricula: string | null;
  hotmartId: string | null;
  origemCadastro: string | null;
  // Auth
  mustChangePassword: boolean;
  senhaTemporaria: string | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Legacy: empresa_id e papel_id serão removidos em FASE 10
  empresaId?: string;
  papelId?: string | null;
  papel?: Papel;
  ativo?: boolean;
  deletedAt?: Date | null;
}

// Vínculo N:N entre usuario e empresa com papel base
export interface UsuarioEmpresa {
  id: string;
  usuarioId: string;
  empresaId: string;
  papelBase: PapelBase;
  papelId: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  ativo: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Usuario com seus vínculos de empresa
export interface UsuarioWithEmpresas extends Usuario {
  vinculos: UsuarioEmpresa[];
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
