/**
 * Tipos de entidades de usuário compartilhados
 */

import type { RoleTipo, RolePermissions } from './papel';

// Roles principais do app
// - aluno: estudante
// - usuario: staff da instituição (professor, admin, staff, monitor)
// - superadmin: administrador do sistema
export type AppUserRole = "aluno" | "usuario" | "superadmin";

export interface AppUser {
  id: string;
  email: string;
  role: AppUserRole;
  // Tipo específico do papel (apenas para role="usuario")
  roleType?: RoleTipo;
  // Permissões do papel
  permissions?: RolePermissions;
  fullName?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  empresaId?: string;
  empresaSlug?: string;
  empresaNome?: string;
}

// Re-export tipos de papel para conveniência
export type { RoleTipo, RolePermissions } from './papel';

export interface StudentCourseSummary {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  empresaId: string | null;
  fullName: string | null;
  email: string;
  cpf: string | null;
  phone: string | null;
  birthDate: Date | null;
  address: string | null;
  zipCode: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  pais: string | null;
  numeroEndereco: string | null;
  complemento: string | null;
  enrollmentNumber: string | null;
  instagram: string | null;
  twitter: string | null;
  hotmartId: string | null;
  origemCadastro: string | null;
  courses: StudentCourseSummary[];
  mustChangePassword: boolean;
  temporaryPassword: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateStudentInput {
  id?: string;
  empresaId?: string;
  fullName?: string;
  email: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  zipCode?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  pais?: string;
  numeroEndereco?: string;
  complemento?: string;
  enrollmentNumber?: string;
  instagram?: string;
  twitter?: string;
  hotmartId?: string;
  origemCadastro?: string;
  courseIds: string[];
  turmaId?: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
}

export interface UpdateStudentInput {
  fullName?: string | null;
  email?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  zipCode?: string | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  pais?: string | null;
  numeroEndereco?: string | null;
  complemento?: string | null;
  enrollmentNumber?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  hotmartId?: string | null;
  origemCadastro?: string | null;
  courseIds?: string[];
  temporaryPassword?: string | null;
  mustChangePassword?: boolean;
}

export interface Teacher {
  id: string;
  empresaId: string;
  isAdmin: boolean;
  fullName: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  pixKey: string | null;
  biography: string | null;
  photoUrl: string | null;
  specialty: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherInput {
  id?: string;
  empresaId: string | null; // Permite null para Super Admin criar professores sem empresa
  isAdmin?: boolean;
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  biography?: string;
  photoUrl?: string;
  specialty?: string;
}

export interface UpdateTeacherInput {
  fullName?: string;
  email?: string;
  cpf?: string | null;
  phone?: string | null;
  pixKey?: string | null;
  biography?: string | null;
  photoUrl?: string | null;
  specialty?: string | null;
}
